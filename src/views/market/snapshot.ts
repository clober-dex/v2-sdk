import { CHAIN_IDS } from '../../constants/chain'
import { MarketSnapshot } from '../../types'
import { fetchMarketSnapshots } from '../../entities/market/apis/snapshot'

export const getMarketSnapshots = async ({
  chainId,
}: {
  chainId: CHAIN_IDS
}): Promise<MarketSnapshot[]> => {
  return fetchMarketSnapshots(chainId)
}
