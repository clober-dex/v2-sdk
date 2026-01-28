import { CHAIN_IDS } from '../../constants/chain-configs/chain'
import { PoolSnapshot } from '../../types'
import {
  fetchPoolSnapshotFromSubgraph,
  fetchPoolSnapshotsFromSubgraph,
} from '../../entities/pool/apis/snapshot'

export const getPoolSnapshot = async ({
  chainId,
  poolKey,
  prices = {},
}: {
  chainId: CHAIN_IDS
  poolKey: `0x${string}`
  prices: Record<`0x${string}`, number>
}): Promise<PoolSnapshot> => {
  const poolSnapshot = await fetchPoolSnapshotFromSubgraph(
    chainId,
    poolKey,
    prices,
  )
  if (!poolSnapshot) {
    throw new Error('Pool is not existed')
  }
  return poolSnapshot
}

export const getPoolSnapshots = async ({
  chainId,
  prices = {},
}: {
  chainId: CHAIN_IDS
  prices: Record<`0x${string}`, number>
}): Promise<PoolSnapshot[]> => {
  return fetchPoolSnapshotsFromSubgraph(chainId, prices)
}
