import { getAddress, PublicClient } from 'viem'

import { CHAIN_IDS } from '../constants/chain'
import { Pool, PoolDto, PoolHourDataDto } from '../model/pool'
import { CONTRACT_ADDRESSES } from '../constants/addresses'
import { toPoolKey } from '../utils/pool-key'
import { REBALANCER_ABI } from '../abis/rebalancer/rebalancer-abi'
import { Currency, Market, PoolPerformanceData } from '../type'
import { STRATEGY_ABI } from '../abis/rebalancer/strategy-abi'
import { Subgraph } from '../constants/subgraph'
import { getContractAddresses } from '../view'

import { fetchMarket } from './market'

export async function fetchPool(
  publicClient: PublicClient,
  chainId: CHAIN_IDS,
  tokenAddresses: `0x${string}`[],
  salt: `0x${string}`,
  useSubgraph: boolean,
  market?: Market,
): Promise<Pool> {
  if (tokenAddresses.length !== 2) {
    throw new Error('Invalid token pair')
  }
  if (!market) {
    market = (
      await fetchMarket(publicClient, chainId, tokenAddresses, useSubgraph)
    ).toJson()
  }
  const poolKey = toPoolKey(
    BigInt(market.bidBook.id),
    BigInt(market.askBook.id),
    salt,
  )
  const [
    { bookIdA, bookIdB, reserveA, reserveB, orderListA, orderListB },
    totalSupply,
    [totalLiquidityA, totalLiquidityB],
    paused,
  ] = await publicClient.multicall({
    allowFailure: false,
    contracts: [
      {
        address: CONTRACT_ADDRESSES[chainId]!.Rebalancer,
        abi: REBALANCER_ABI,
        functionName: 'getPool',
        args: [poolKey],
      },
      {
        address: CONTRACT_ADDRESSES[chainId]!.Rebalancer,
        abi: REBALANCER_ABI,
        functionName: 'totalSupply',
        args: [BigInt(poolKey)],
      },
      {
        address: CONTRACT_ADDRESSES[chainId]!.Rebalancer,
        abi: REBALANCER_ABI,
        functionName: 'getLiquidity',
        args: [poolKey],
      },
      {
        address: CONTRACT_ADDRESSES[chainId]!.Strategy,
        abi: STRATEGY_ABI,
        functionName: 'isPaused',
        args: [poolKey],
      },
    ],
  })
  const liquidityA =
    totalLiquidityA.reserve +
    totalLiquidityA.cancelable +
    totalLiquidityA.claimable
  const liquidityB =
    totalLiquidityB.reserve +
    totalLiquidityB.cancelable +
    totalLiquidityB.claimable
  return new Pool({
    chainId,
    market,
    isOpened: bookIdA > 0 && bookIdB > 0,
    bookIdA,
    bookIdB,
    poolKey,
    totalSupply: BigInt(totalSupply),
    decimals: 18,
    liquidityA: BigInt(liquidityA),
    liquidityB: BigInt(liquidityB),
    cancelableA: BigInt(totalLiquidityA.cancelable),
    cancelableB: BigInt(totalLiquidityB.cancelable),
    claimableA: BigInt(totalLiquidityA.claimable),
    claimableB: BigInt(totalLiquidityB.claimable),
    reserveA: BigInt(reserveA),
    reserveB: BigInt(reserveB),
    orderListA: orderListA.map((id: bigint) => BigInt(id)),
    orderListB: orderListB.map((id: bigint) => BigInt(id)),
    paused,
  })
}

export const fetchPoolPerformanceFromSubgraph = async (
  chainId: CHAIN_IDS,
  poolKey: `0x${string}`,
): Promise<PoolPerformanceData | null> => {
  const {
    data: { pool, poolHourDatas },
  } = await Subgraph.get<{
    data: {
      pool: PoolDto | null
      poolHourDatas: PoolHourDataDto[]
    }
  }>(
    chainId,
    'getPoolPerformance',
    'query getPoolPerformance($poolKey: ID!) { pool(id: $poolKey) { id tokenA { id name symbol decimals } tokenB { id name symbol decimals } initialTotalSupply initialTokenAAmount initialTokenBAmount initialLPPriceUSD createdAtTimestamp createdAtTransaction { id } totalValueLockedUSD totalSupply volumeUSD lpPriceUSD spreadProfitUSD } poolHourDatas( where: {pool: $poolKey, oraclePrice_gt: 0} orderBy: date orderDirection: desc first: 1000 ) { date totalValueLockedUSD totalSupply spreadProfitUSD lpPriceUSD oraclePrice priceA priceB volumeTokenA volumeTokenB volumeUSD } }',
    {
      poolKey: poolKey.toLowerCase(),
    },
  )
  if (!pool) {
    return null
  }
  const currencyA: Currency = {
    address: getAddress(pool.tokenA.id),
    name: pool.tokenA.name,
    symbol: pool.tokenA.symbol,
    decimals: Number(pool.tokenA.decimals),
  }
  const currencyB: Currency = {
    address: getAddress(pool.tokenB.id),
    name: pool.tokenB.name,
    symbol: pool.tokenB.symbol,
    decimals: Number(pool.tokenB.decimals),
  }
  const currencyLp = {
    id: pool.id as `0x${string}`,
    address: getContractAddresses({ chainId }).Rebalancer,
    name: pool.tokenA.name + '/' + pool.tokenB.name,
    symbol: pool.tokenA.symbol + '/' + pool.tokenB.symbol,
    decimals: 18,
  }
  return {
    chainId,
    key: poolKey,
    initialLPInfo: {
      tokenA: {
        currency: currencyA,
        value: pool.initialTokenAAmount,
      },
      tokenB: {
        currency: currencyB,
        value: pool.initialTokenBAmount,
      },
      lpToken: {
        currency: currencyLp,
        value: pool.initialTotalSupply,
      },
      lpPriceUSD: pool.initialLPPriceUSD,
      timestamp: Number(pool.createdAtTimestamp),
      txHash: pool.createdAtTransaction.id as `0x${string}`,
    },
    currencyA,
    currencyB,
    currencyLp,
    volumeUSD24h: pool.volumeUSD,
    lpPriceUSD: pool.lpPriceUSD,
    totalTvlUSD: pool.totalValueLockedUSD,
    totalSpreadProfitUSD: pool.spreadProfitUSD,
    performanceHistories: poolHourDatas.map((poolHourData) => ({
      timestamp: poolHourData.date,
      spreadProfitUSD: poolHourData.spreadProfitUSD,
      tvlUSD: poolHourData.totalValueLockedUSD,
      lpPriceUSD: poolHourData.lpPriceUSD,
      oraclePrice: poolHourData.oraclePrice,
      priceA: poolHourData.priceA,
      priceB: poolHourData.priceB,
      volumeA: {
        currency: currencyA,
        value: poolHourData.volumeTokenA,
      },
      volumeB: {
        currency: currencyB,
        value: poolHourData.volumeTokenB,
      },
      volumeUSD: poolHourData.volumeUSD,
    })),
  }
}
