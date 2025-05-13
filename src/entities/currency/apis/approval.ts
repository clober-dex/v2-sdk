import { PublicClient } from 'viem'

import { CHAIN_IDS } from '../../../constants/chain'
import { CONTRACT_ADDRESSES } from '../../../constants/addresses'

export async function fetchIsApprovedForAll(
  publicClient: PublicClient,
  chainId: CHAIN_IDS,
  owner: `0x${string}`,
): Promise<boolean> {
  return publicClient.readContract({
    address: CONTRACT_ADDRESSES[chainId]!.BookManager,
    abi: [
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
    ] as const,
    functionName: 'isApprovedForAll',
    args: [owner, CONTRACT_ADDRESSES[chainId]!.Controller],
  })
}
