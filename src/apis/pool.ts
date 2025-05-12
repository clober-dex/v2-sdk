import { formatUnits, getAddress, PublicClient } from 'viem'

import { CHAIN_IDS } from '../constants/chain'
import { Pool, PoolDto, PoolHourDataDto } from '../model/pool'
import { CONTRACT_ADDRESSES } from '../constants/addresses'
import { toPoolKey } from '../utils/pool-key'
import { REBALANCER_ABI } from '../abis/rebalancer/rebalancer-abi'
import { Market, PoolPerformanceData } from '../type'
import { STRATEGY_ABI } from '../abis/rebalancer/strategy-abi'
import { Subgraph } from '../constants/subgraph'

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
    'query getPoolPerformance($poolKey: ID!) { pool(id: $poolKey) { id tokenA { id name symbol decimals } tokenB { id name symbol decimals } initialTotalSupply initialTokenAAmount initialTokenBAmount initialLPPriceUSD createdAtTimestamp createdAtTransaction { id } totalSupply volumeUSD lpPriceUSD spreadProfitUSD } poolHourDatas( where: {pool: $poolKey, oraclePrice_gt: 0} orderBy: date orderDirection: desc first: 1000 ) { date totalSupply spreadProfitUSD lpPriceUSD oraclePrice priceA priceB volumeTokenA volumeTokenB volumeUSD } }',
    {
      poolKey: poolKey.toLowerCase(),
    },
  )
  if (!pool) {
    return null
  }
  return {
    chainId,
    key: poolKey,
    initialLPInfo: {
      tokenAAmount: Number(
        formatUnits(
          BigInt(pool.initialTokenAAmount),
          Number(pool.tokenA.decimals),
        ),
      ),
      tokenBAmount: Number(
        formatUnits(
          BigInt(pool.initialTokenBAmount),
          Number(pool.tokenB.decimals),
        ),
      ),
      lpTokenAmount: Number(formatUnits(BigInt(pool.initialTotalSupply), 18)),
      lpPriceUSD: Number(pool.initialLPPriceUSD),
      timestamp: Number(pool.createdAtTimestamp),
      txHash: pool.createdAtTransaction.id as `0x${string}`,
    },
    currencyA: {
      address: getAddress(pool.tokenA.id),
      name: pool.tokenA.name,
      symbol: pool.tokenA.symbol,
      decimals: Number(pool.tokenA.decimals),
    },
    currencyB: {
      address: getAddress(pool.tokenB.id),
      name: pool.tokenB.name,
      symbol: pool.tokenB.symbol,
      decimals: Number(pool.tokenB.decimals),
    },
    currencyLp: {
      id: pool.id as `0x${string}`,
      address: getAddress(pool.id),
      name: pool.tokenA.name + '/' + pool.tokenB.name,
      symbol: pool.tokenA.symbol + '/' + pool.tokenB.symbol,
      decimals: Number(pool.tokenA.decimals),
    },
    volumeUSD24h: Number(pool.volumeUSD),
    lpPriceUSD: Number(pool.lpPriceUSD),
    totalTvlUSD:
      Number(pool.lpPriceUSD) *
      Number(formatUnits(BigInt(pool.totalSupply), 18)),
    totalSpreadProfitUSD: Number(pool.spreadProfitUSD),
    performanceHistories: poolHourDatas.map((poolHourData) => ({
      timestamp: poolHourData.date,
      spreadProfitUSD: Number(poolHourData.spreadProfitUSD),
      tvlUSD:
        // TODO: use poolHourData.totalValueLockedUSD instead of poolHourData.totalSupply * poolHourData.lpPriceUSD
        Number(poolHourData.lpPriceUSD) *
        Number(formatUnits(BigInt(poolHourData.totalSupply), 18)),
      lpPriceUSD: Number(poolHourData.lpPriceUSD),
      oraclePrice: poolHourData.oraclePrice,
      priceA: Number(poolHourData.priceA),
      priceB: Number(poolHourData.priceB),
      volumeA: Number(poolHourData.volumeTokenA),
      volumeB: Number(poolHourData.volumeTokenB),
      volumeUSD: Number(poolHourData.volumeUSD),
    })),
  }
}
