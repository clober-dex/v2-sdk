import { CHAIN_IDS } from '../constants/chain-configs/chain'
import {
  AnalyticsSummary,
  TopUser,
  UserVolumeSnapshot,
} from '../entities/analytics/types'
import {
  fetchProtocolAnalytics,
  fetchTopUsersByNativeVolume,
  fetchUserNativeVolume,
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

export const getTopUsersByNativeVolume = async ({
  chainId,
}: {
  chainId: CHAIN_IDS
}): Promise<TopUser[]> => {
  return fetchTopUsersByNativeVolume(chainId)
}

export const getUserNativeVolume = async ({
  chainId,
  userAddress,
}: {
  chainId: CHAIN_IDS
  userAddress: `0x${string}`
}): Promise<number> => {
  return fetchUserNativeVolume(chainId, userAddress)
}
