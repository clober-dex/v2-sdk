import { CHAIN_IDS } from '../constants/chain'
import { cachedPublicClients } from '../constants/client'
import { CONTRACT_ADDRESSES } from '../constants/addresses'

const _abi = [
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
] as const

export async function fetchIsOpened(chainId: CHAIN_IDS, bookId: bigint) {
  return cachedPublicClients[chainId].readContract({
    address: CONTRACT_ADDRESSES[chainId]!.BookManager,
    abi: _abi,
    functionName: 'isOpened',
    args: [bookId],
  })
}
