import { createPublicClient, http } from 'viem'

import { CHAIN_IDS, CHAIN_MAP } from '../constants/chain-configs/chain'
import { DefaultReadContractOptions, Swap } from '../types'
import { fetchLatestTrades } from '../entities/swap/apis'

export const getLatestTrades = async ({
  chainId,
  n,
  options,
}: {
  chainId: CHAIN_IDS
  n: number
  options?: {
    useSubgraph?: boolean
  } & DefaultReadContractOptions
}): Promise<Swap[]> => {
  const publicClient = createPublicClient({
    chain: CHAIN_MAP[chainId],
    transport: options?.rpcUrl ? http(options.rpcUrl) : http(),
  })
  return fetchLatestTrades(
    publicClient,
    chainId,
    n,
    !!(options && options.useSubgraph),
  )
}
