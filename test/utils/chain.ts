import { createPublicClient, http } from 'viem'
import { arbitrumSepolia } from 'viem/chains'

export const fetchBlockNumer = async (): Promise<bigint> => {
  const publicClient = createPublicClient({
    chain: arbitrumSepolia,
    transport: http(),
  })
  return publicClient.getBlockNumber()
}
