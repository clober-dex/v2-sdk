import { createPublicClient, http } from 'viem'
import { arbitrumSepolia } from 'viem/chains'

import { FORK_URL } from './constants'

export const fetchBlockNumer = async (): Promise<bigint> => {
  const publicClient = createPublicClient({
    chain: arbitrumSepolia,
    transport: http(FORK_URL),
  })
  return publicClient.getBlockNumber()
}
