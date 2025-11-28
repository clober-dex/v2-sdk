import { formatUnits, getAddress } from 'viem'

import { CHAIN_IDS } from '../../../constants/chain-configs/chain'
import { Currency, PoolSnapshot } from '../../../types'
import { Subgraph } from '../../../constants/chain-configs/subgraph'
import { getContractAddresses } from '../../../views'

type PoolDto = {
  id: string
  salt: string
  tokenA: {
    id: string
    name: string
    symbol: string
    decimals: string
    tokenDayData: {
      date: number
      priceUSD: string
    }[]
  }
  tokenB: {
    id: string
    name: string
    symbol: string
    decimals: string
    tokenDayData: {
      date: number
      priceUSD: string
    }[]
  }
  initialTotalSupply: string
  initialTokenAAmount: string
  initialTokenBAmount: string
  initialLPPriceUSD: string
  createdAtTimestamp: string
  createdAtTransaction: {
    id: string
  }
  totalValueLockedUSD: string
  totalSupply: string
  volumeUSD: string
  lpPriceUSD: string
  spreadProfitUSD: string
}

type PoolPeriodDataDto = {
  date: number
  totalValueLockedUSD: string
  totalSupply: string
  spreadProfitUSD: string
  lpPriceUSD: string
  oraclePrice: string
  priceA: string
  priceB: string
  volumeTokenA: string
  volumeTokenB: string
  volumeUSD: string
}

export const fetchPoolSnapshotFromSubgraph = async (
  chainId: CHAIN_IDS,
  poolKey: `0x${string}`,
): Promise<PoolSnapshot | null> => {
  const {
    data: { pool, poolDayDatas, poolHourDatas },
  } = await Subgraph.get<{
    data: {
      pool: PoolDto | null
      poolDayDatas: PoolPeriodDataDto[]
      poolHourDatas: PoolPeriodDataDto[]
    }
  }>(
    chainId,
    'getPoolSnapshot',
    'query getPoolSnapshot($poolKey: ID!) { pool(id: $poolKey) { id salt tokenA { id name symbol decimals tokenDayData(orderBy: date, orderDirection: asc) { date priceUSD } } tokenB { id name symbol decimals tokenDayData(orderBy: date, orderDirection: asc) { date priceUSD } } initialTotalSupply initialTokenAAmount initialTokenBAmount initialLPPriceUSD createdAtTimestamp createdAtTransaction { id } totalValueLockedUSD totalSupply volumeUSD lpPriceUSD spreadProfitUSD } poolDayDatas( where: {pool: $poolKey, oraclePrice_gt: 0} orderBy: date orderDirection: desc first: 1000 ) { date totalValueLockedUSD totalSupply spreadProfitUSD lpPriceUSD oraclePrice priceA priceB volumeTokenA volumeTokenB volumeUSD } poolHourDatas( where: {pool: $poolKey, oraclePrice_gt: 0} orderBy: date orderDirection: desc first: 24 ) { date totalValueLockedUSD totalSupply spreadProfitUSD lpPriceUSD oraclePrice priceA priceB volumeTokenA volumeTokenB volumeUSD } }',
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
  const lpCurrency = {
    id: pool.id as `0x${string}`,
    address: getContractAddresses({ chainId }).Rebalancer,
    name: `Clober Liquidity Vault ${currencyB.symbol}-${currencyA.symbol}`,
    symbol: `CLV-${currencyB.symbol}-${currencyA.symbol}`,
    decimals: 18,
  }
  return {
    chainId,
    key: poolKey,
    salt: pool.salt as `0x${string}`,
    initialLPInfo: {
      currencyA: {
        currency: currencyA,
        value: formatUnits(
          BigInt(pool.initialTokenAAmount),
          Number(pool.tokenA.decimals),
        ),
      },
      currencyB: {
        currency: currencyB,
        value: formatUnits(
          BigInt(pool.initialTokenBAmount),
          Number(pool.tokenB.decimals),
        ),
      },
      lpToken: {
        currency: lpCurrency,
        value: formatUnits(BigInt(pool.initialTotalSupply), 18),
      },
      lpPriceUSD: pool.initialLPPriceUSD,
      timestamp: Number(pool.createdAtTimestamp),
      txHash: pool.createdAtTransaction.id as `0x${string}`,
    },
    currencyA,
    currencyB,
    lpCurrency,
    volumeUSD24h: poolHourDatas
      .reduce((acc, data) => acc + Number(data.volumeUSD), 0)
      .toString(),
    lpPriceUSD: pool.lpPriceUSD,
    totalTvlUSD: pool.totalValueLockedUSD,
    totalSpreadProfitUSD: pool.spreadProfitUSD,
    performanceHistories: poolDayDatas.map((poolDayData) => ({
      timestamp: poolDayData.date,
      spreadProfitUSD: poolDayData.spreadProfitUSD,
      tvlUSD: poolDayData.totalValueLockedUSD,
      lpPriceUSD: poolDayData.lpPriceUSD,
      oraclePrice: poolDayData.oraclePrice,
      priceA: poolDayData.priceA,
      priceAUSD: Number(
        pool.tokenA.tokenDayData.find(({ date }) => date === poolDayData.date)
          ?.priceUSD ?? 0,
      ),
      priceB: poolDayData.priceB,
      priceBUSD: Number(
        pool.tokenB.tokenDayData.find(({ date }) => date === poolDayData.date)
          ?.priceUSD ?? 0,
      ),
      volumeA: {
        currency: currencyA,
        value: poolDayData.volumeTokenA,
      },
      volumeB: {
        currency: currencyB,
        value: poolDayData.volumeTokenB,
      },
      volumeUSD: poolDayData.volumeUSD,
    })),
  }
}

export const fetchPoolSnapshotsFromSubgraph = async (
  chainId: CHAIN_IDS,
): Promise<PoolSnapshot[]> => {
  const {
    data: { pools },
  } = await Subgraph.get<{
    data: {
      pools: {
        id: string
      }[]
    }
  }>(chainId, 'getPoolKeys', 'query getPoolKeys { pools { id } }', {})
  return Promise.all(
    pools.map(async (pool) => {
      return fetchPoolSnapshotFromSubgraph(chainId, pool.id as `0x${string}`)
    }),
  ) as Promise<PoolSnapshot[]>
}
