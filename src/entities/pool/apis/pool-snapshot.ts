import { getAddress } from 'viem'

import { CHAIN_IDS } from '../../../constants/chain'
import { Currency, PoolSnapshot } from '../../../type'
import { Subgraph } from '../../../constants/subgraph'
import { getContractAddresses } from '../../../view'

type PoolDto = {
  id: string
  tokenA: {
    id: string
    name: string
    symbol: string
    decimals: string
  }
  tokenB: {
    id: string
    name: string
    symbol: string
    decimals: string
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

type PoolHourDataDto = {
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
    data: { pool, poolHourDatas },
  } = await Subgraph.get<{
    data: {
      pool: PoolDto | null
      poolHourDatas: PoolHourDataDto[]
    }
  }>(
    chainId,
    'getPoolSnapshot',
    'query getPoolSnapshot($poolKey: ID!) { pool(id: $poolKey) { id tokenA { id name symbol decimals } tokenB { id name symbol decimals } initialTotalSupply initialTokenAAmount initialTokenBAmount initialLPPriceUSD createdAtTimestamp createdAtTransaction { id } totalValueLockedUSD totalSupply volumeUSD lpPriceUSD spreadProfitUSD } poolHourDatas( where: {pool: $poolKey, oraclePrice_gt: 0} orderBy: date orderDirection: desc first: 1000 ) { date totalValueLockedUSD totalSupply spreadProfitUSD lpPriceUSD oraclePrice priceA priceB volumeTokenA volumeTokenB volumeUSD } }',
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
