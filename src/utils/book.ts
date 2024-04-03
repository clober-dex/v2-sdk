import { createPublicClient, http } from 'viem'

import { CHAIN_IDS, CHAIN_MAP } from '../constants/chain'
import { CONTRACT_ADDRESSES } from '../constants/addresses'

import { toBookId } from './book-id'

export const isOpen = async (
  chainId: CHAIN_IDS,
  inputToken: `0x${string}`,
  outputToken: `0x${string}`,
  unit: bigint,
): Promise<boolean> => {
  const bookId = toBookId(inputToken, outputToken, unit)
  const publicClient = createPublicClient({
    chain: CHAIN_MAP[chainId],
    transport: http(),
  })
  return publicClient.readContract({
    address: CONTRACT_ADDRESSES[chainId]!.BookManager,
    abi: [
      {
        inputs: [
          {
            internalType: 'BookId',
            name: 'id',
            type: 'uint192',
          },
        ],
        name: 'isOpened',
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
    functionName: 'isOpened',
    args: [bookId],
  })
}
