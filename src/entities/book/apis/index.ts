import { PublicClient } from 'viem'

import { CHAIN_IDS } from '../../../constants/chain'
import { Currency } from '../../../model/currency'
import { calculateUnitSize } from '../../../utils/unit-size'
import { CONTRACT_ADDRESSES } from '../../../constants/addresses'
import { BOOK_VIEWER_ABI } from '../../../abis/core/book-viewer-abi'
import { Subgraph } from '../../../constants/subgraph'
import { toBookId } from '../utils'
import { Book } from '../model'

import { fetchIsMarketOpened } from './open'

export const fetchBook = async (
  publicClient: PublicClient,
  chainId: CHAIN_IDS,
  quoteCurrency: Currency,
  baseCurrency: Currency,
  useSubgraph: boolean,
  n: number,
): Promise<Book> => {
  const unitSize = calculateUnitSize(chainId, quoteCurrency)
  const bookId = toBookId(
    chainId,
    quoteCurrency.address,
    baseCurrency.address,
    unitSize,
  )
  if (useSubgraph) {
    const {
      data: { book },
    } = await Subgraph.get<{
      data: {
        book: {
          depths: {
            tick: string
            price: string
            unitAmount: string
          }[]
        } | null
      }
    }>(
      chainId,
      'getBook',
      'query getBook($bookId: ID!) { book(id: $bookId) { depths(where: {unitAmount_gt: 0}) { tick unitAmount } } }',
      {
        bookId,
      },
    )
    return new Book({
      chainId,
      id: bookId,
      base: baseCurrency,
      quote: quoteCurrency,
      unitSize,
      depths: book
        ? book.depths.map(
            ({ tick, unitAmount }: { tick: string; unitAmount: string }) => ({
              tick: BigInt(tick),
              unitAmount: BigInt(unitAmount),
            }),
          )
        : [],
      isOpened: book !== null,
    })
  }

  const [depths, isOpened] = await Promise.all([
    publicClient.readContract({
      address: CONTRACT_ADDRESSES[chainId]!.BookViewer,
      abi: BOOK_VIEWER_ABI,
      functionName: 'getLiquidity',
      args: [bookId, Number(2n ** 19n - 1n), BigInt(n)],
    }),
    fetchIsMarketOpened(publicClient, chainId, bookId),
  ])

  return new Book({
    chainId,
    id: bookId,
    base: baseCurrency,
    quote: quoteCurrency,
    unitSize,
    depths: depths.map(({ tick, depth }: { tick: number; depth: bigint }) => ({
      tick: BigInt(tick),
      unitAmount: depth,
    })),
    isOpened,
  })
}
