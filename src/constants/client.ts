import { createPublicClient, http, type PublicClient } from 'viem'
import { eip712WalletActions } from 'viem/zksync'

import { CHAIN_IDS, CHAIN_MAP } from './chain'

export const cachedPublicClients: Record<CHAIN_IDS, PublicClient> = {} as const
export const buildPublicClient = (chainId: CHAIN_IDS, rpcUrl?: string) => {
  cachedPublicClients[chainId] = createPublicClient({
    chain: CHAIN_MAP[chainId],
    transport: rpcUrl ? http(rpcUrl) : http(),
  })

  if (chainId === CHAIN_IDS.ZKSYNC_SEPOLIA) {
    cachedPublicClients[chainId] = cachedPublicClients[chainId]!.extend(
      eip712WalletActions(),
    )
  }
}
