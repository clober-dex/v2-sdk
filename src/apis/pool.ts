import { PublicClient } from 'viem'

import { CHAIN_IDS } from '../constants/chain'
import {
  Pool,
  PoolSnapshotDto,
  PoolSpreadProfitDto,
  PoolVolumeDto,
} from '../model/pool'
import { CONTRACT_ADDRESSES } from '../constants/addresses'
import { toPoolKey } from '../utils/pool-key'
import { REBALANCER_ABI } from '../abis/rebalancer/rebalancer-abi'
import { CHART_LOG_INTERVALS, Market } from '../type'
import { Subgraph } from '../constants/subgraph'

import { fetchMarket } from './market'

export const fetchPoolPerformance = async (
  chainId: CHAIN_IDS,
  poolKey: `0x${string}`,
  volumeFromTimestamp: number,
  snapshotFromTimestamp: number,
  snapshotIntervalType: CHART_LOG_INTERVALS,
  spreadProfitFromTimestamp: number,
) => {
  const result = await Subgraph.get<{
    data: {
      poolVolumes: PoolVolumeDto[]
      poolSnapshots: PoolSnapshotDto[]
      poolSnapshotBefore: PoolSnapshotDto[]
      poolSpreadProfits: PoolSpreadProfitDto[]
    }
  }>(
    chainId,
    'getPoolPerformanceData',
    'query getPoolPerformanceData($poolKey: String!, $volumeFrom: BigInt!, $snapshotFrom: BigInt!, $snapshotIntervalType: String!, $spreadProfitFrom: BigInt!) { poolVolumes(where: { poolKey: $poolKey, intervalType: "1d", timestamp_gte: $volumeFrom, }) { id poolKey intervalType timestamp currencyAVolume currencyBVolume bookACurrencyAVolume bookACurrencyBVolume bookBCurrencyAVolume bookBCurrencyBVolume } poolSnapshots( first: 1000, skip: 0, orderBy: timestamp, orderDirection: asc where: { poolKey: $poolKey, intervalType: $snapshotIntervalType, timestamp_gte: $snapshotFrom, } ) { id poolKey intervalType timestamp price liquidityA liquidityB totalSupply } poolSnapshotBefore: poolSnapshots( first: 1, skip: 0, orderBy: timestamp, orderDirection: desc, where: { poolKey: $poolKey, intervalType: $snapshotIntervalType, timestamp_lt: $snapshotFrom, } ) { id poolKey intervalType timestamp price liquidityA liquidityB totalSupply } poolSpreadProfits( where: { intervalType: "1h", timestamp_gte: $spreadProfitFrom, } ) { id intervalType timestamp accumulatedProfitInUsd } }',
    {
      poolKey,
      volumeFrom: volumeFromTimestamp,
      snapshotFrom: snapshotFromTimestamp,
      snapshotIntervalType: snapshotIntervalType.valueOf(),
      spreadProfitFrom: spreadProfitFromTimestamp,
    },
  )
  return {
    poolVolumes: result.data.poolVolumes,
    poolSnapshots: result.data.poolSnapshotBefore.concat(
      result.data.poolSnapshots,
    ),
    poolSpreadProfits: result.data.poolSpreadProfits,
  }
}

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
    { bookIdA, bookIdB, reserveA, reserveB, orderListA, orderListB, paused },
    totalSupply,
    [totalLiquidityA, totalLiquidityB],
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
    salt,
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
