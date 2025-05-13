import { CHAIN_IDS } from '../../constants/chain'
import { PoolSnapshot } from '../../types'
import {
  fetchPoolSnapshotFromSubgraph,
  fetchPoolSnapshotsFromSubgraph,
} from '../../entities/pool/apis/snapshot'

export const getPoolSnapshot = async ({
  chainId,
  poolKey,
}: {
  chainId: CHAIN_IDS
  poolKey: `0x${string}`
}): Promise<PoolSnapshot> => {
  const poolSnapshot = await fetchPoolSnapshotFromSubgraph(chainId, poolKey)
  if (!poolSnapshot) {
    throw new Error('Pool is not existed')
  }
  return poolSnapshot
}

export const getPoolSnapshots = async ({
  chainId,
}: {
  chainId: CHAIN_IDS
}): Promise<PoolSnapshot[]> => {
  return fetchPoolSnapshotsFromSubgraph(chainId)
}
