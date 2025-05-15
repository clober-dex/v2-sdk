import { CHAIN_IDS } from '../constants/chain-configs/chain'
import {
  AnalyticsSummary,
  UserVolumeSnapshot,
} from '../entities/analytics/types'
import {
  fetchProtocolAnalytics,
  fetchUserVolumeSnapshots,
} from '../entities/analytics/apis'

export const getProtocolAnalytics = async ({
  chainId,
}: {
  chainId: CHAIN_IDS
}): Promise<AnalyticsSummary> => {
  return fetchProtocolAnalytics(chainId)
}

export const getUserDailyVolumes = async ({
  chainId,
  userAddress,
}: {
  chainId: CHAIN_IDS
  userAddress: `0x${string}`
}): Promise<UserVolumeSnapshot[]> => {
  return fetchUserVolumeSnapshots(chainId, userAddress)
}
