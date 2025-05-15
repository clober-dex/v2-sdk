import { CHAIN_IDS } from '../constants/chain-configs/chain'
import { AnalyticsSummary } from '../entities/analytics/types'
import { fetchProtocolAnalytics } from '../entities/analytics/apis'

export const getProtocolAnalytics = async ({
  chainId,
}: {
  chainId: CHAIN_IDS
}): Promise<AnalyticsSummary> => {
  return fetchProtocolAnalytics(chainId)
}
