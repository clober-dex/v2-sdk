import { PublicClient } from 'viem'

import { CHAIN_IDS } from '../../../constants/chains'
import { CONTRACT_ADDRESSES } from '../../../constants/addresses'

const buildBookCacheKey = (chainId: CHAIN_IDS, bookId: bigint) =>
  `${chainId}:${bookId}`
const isMarketOpenedCache = new Map<string, boolean>()
const getIsMarketOpenedFromCache = (chainId: CHAIN_IDS, bookId: bigint) =>
  isMarketOpenedCache.get(buildBookCacheKey(chainId, bookId))
const setIsMarketOpenedToCache = (
  chainId: CHAIN_IDS,
  bookId: bigint,
  isOpened: boolean,
) => isMarketOpenedCache.set(buildBookCacheKey(chainId, bookId), isOpened)

export async function fetchIsMarketOpened(
  publicClient: PublicClient,
  chainId: CHAIN_IDS,
  bookId: bigint,
) {
  const cachedIsMarketOpened = getIsMarketOpenedFromCache(chainId, bookId)
  if (cachedIsMarketOpened !== undefined) {
    return cachedIsMarketOpened
  }
  const isMarketOpened = await publicClient.readContract({
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
  if (isMarketOpened) {
    setIsMarketOpenedToCache(chainId, bookId, isMarketOpened)
  }
  return isMarketOpened
}
