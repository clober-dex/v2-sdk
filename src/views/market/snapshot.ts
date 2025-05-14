import { createPublicClient, http } from 'viem'

import { CHAIN_IDS, CHAIN_MAP } from '../../constants/chain-configs/chain'
import { DefaultReadContractOptions, MarketSnapshot } from '../../types'
import { fetchMarketSnapshots } from '../../entities/market/apis/snapshot'

export const getMarketSnapshots = async ({
  chainId,
  options,
}: {
  chainId: CHAIN_IDS
  options?: DefaultReadContractOptions
}): Promise<MarketSnapshot[]> => {
  const publicClient = createPublicClient({
    chain: CHAIN_MAP[chainId],
    transport: options?.rpcUrl ? http(options.rpcUrl) : http(),
  })
  return fetchMarketSnapshots(publicClient, chainId)
}
