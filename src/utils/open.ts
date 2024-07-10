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

const buildBookCacheKey = (chainId: CHAIN_IDS, bookId: bigint) =>
  `${chainId}:${bookId}`
const isOpenedCache = new Map<string, boolean>()
const getIsOpenedFromCache = (chainId: CHAIN_IDS, bookId: bigint) =>
  isOpenedCache.get(buildBookCacheKey(chainId, bookId))
const setIsOpenedToCache = (
  chainId: CHAIN_IDS,
  bookId: bigint,
  isOpened: boolean,
) => isOpenedCache.set(buildBookCacheKey(chainId, bookId), isOpened)

export async function fetchIsOpened(chainId: CHAIN_IDS, bookId: bigint) {
  const cachedIsOpened = getIsOpenedFromCache(chainId, bookId)
  if (cachedIsOpened !== undefined) {
    return cachedIsOpened
  }
  const isOpened = await cachedPublicClients[chainId].readContract({
    address: CONTRACT_ADDRESSES[chainId]!.BookManager,
    abi: _abi,
    functionName: 'isOpened',
    args: [bookId],
  })
  setIsOpenedToCache(chainId, bookId, isOpened)
  return isOpened
}
