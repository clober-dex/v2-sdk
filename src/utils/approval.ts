import { createPublicClient, http } from 'viem'

import { CHAIN_IDS, CHAIN_MAP } from '../constants/chain'
import { CONTRACT_ADDRESSES } from '../constants/addresses'

const _abi = [
  {
    inputs: [
      {
        internalType: 'address',
        name: 'owner',
        type: 'address',
      },
      {
        internalType: 'address',
        name: 'operator',
        type: 'address',
      },
    ],
    name: 'isApprovedForAll',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const

export async function fetchIsApprovedForAll(
  chainId: CHAIN_IDS,
  owner: `0x${string}`,
  rpcUrl?: string,
): Promise<boolean> {
  const publicClient = createPublicClient({
    chain: CHAIN_MAP[chainId],
    transport: rpcUrl ? http(rpcUrl) : http(),
  })
  return publicClient.readContract({
    address: CONTRACT_ADDRESSES[chainId]!.BookManager,
    abi: _abi,
    functionName: 'isApprovedForAll',
    args: [owner, CONTRACT_ADDRESSES[chainId]!.Controller],
  })
}
