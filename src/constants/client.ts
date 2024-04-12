import { type PublicClient, createPublicClient, http } from 'viem'

import { CHAIN_IDS, CHAIN_MAP } from './chain'

export const cachedPublicClients: Record<CHAIN_IDS, PublicClient> = {} as const
export const buildPublicClient = (chainId: CHAIN_IDS, rpcUrl?: string) => {
  cachedPublicClients[chainId] = createPublicClient({
    chain: CHAIN_MAP[chainId],
    transport: rpcUrl ? http(rpcUrl) : http(),
  })
}
