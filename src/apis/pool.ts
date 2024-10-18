import { PublicClient } from 'viem'

import { CHAIN_IDS } from '../constants/chain'
import { Pool, PoolSnapshotDto, PoolVolumeDto } from '../model/pool'
import { CONTRACT_ADDRESSES } from '../constants/addresses'
import { toPoolKey } from '../utils/pool-key'
import { REBALANCER_ABI } from '../abis/rebalancer/rebalancer-abi'
import { Market } from '../type'
import { Subgraph } from '../constants/subgraph'

import { fetchMarket } from './market'

export const fetchPoolPerformance = async (
  chainId: CHAIN_IDS,
  poolKey: `0x${string}`,
  volumeFromTimestamp: number,
  snapshotFromTimestamp: number,
) => {
  return Subgraph.get<{
    data: {
      poolVolumes: PoolVolumeDto[]
      poolSnapshots: PoolSnapshotDto[]
    }
  }>(
    chainId,
    'getPoolPerformanceData',
    'query getPoolPerformanceData($poolKey: String!, $volumeFrom: BigInt!, $snapshotFrom: BigInt!) { poolVolumes(where: { poolKey: $poolKey, intervalType: "1d", timestamp_gte: $volumeFrom, }) { id poolKey intervalType timestamp currencyAVolume currencyBVolume bookACurrencyAVolume bookACurrencyBVolume bookBCurrencyAVolume bookBCurrencyBVolume } poolSnapshots( where: { poolKey: $poolKey, intervalType: "1h", timestamp_gte: $snapshotFrom, } ) { id poolKey intervalType timestamp price liquidityA liquidityB totalSupply } }',
    {
      poolKey,
      volumeFrom: BigInt(volumeFromTimestamp),
      snapshotFrom: BigInt(snapshotFromTimestamp),
    },
  )
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
