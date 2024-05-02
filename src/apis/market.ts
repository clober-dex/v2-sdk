import { CHAIN_IDS } from '../constants/chain'
import { Market } from '../model/market'
import { Book } from '../model/book'
import { getMarketId } from '../utils/market'
import { toBookId } from '../utils/book-id'
import { calculateUnitSize } from '../utils/unit-size'
import type { Currency } from '../model/currency'
import { CONTRACT_ADDRESSES } from '../constants/addresses'
import { cachedPublicClients } from '../constants/client'
import { BOOK_VIEWER_ABI } from '../abis/core/book-viewer-abi'
import { fetchIsOpened } from '../utils/open'
import { fetchCurrency } from '../utils/currency'
import { cachedSubgraph } from '../constants/subgraph'

const fetchBook = async (chainId: CHAIN_IDS, bookId: string) => {
  return cachedSubgraph[chainId]!.get<{
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
    'getBook',
    'query getBook($bookId: ID!) { book(id: $bookId){ depths { tick unitAmount } } }',
    {
      bookId,
    },
  )
}

const getBook = async (
  chainId: CHAIN_IDS,
  quoteCurrency: Currency,
  baseCurrency: Currency,
  n: number,
): Promise<Book> => {
  const unitSize = await calculateUnitSize(chainId, quoteCurrency)
  const bookId = toBookId(quoteCurrency.address, baseCurrency.address, unitSize)
  if (cachedSubgraph[chainId]) {
    const {
      data: { book },
    } = await fetchBook(chainId, bookId.toString())
    new Book({
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
    cachedPublicClients[chainId].readContract({
      address: CONTRACT_ADDRESSES[chainId]!.BookViewer,
      abi: BOOK_VIEWER_ABI,
      functionName: 'getLiquidity',
      args: [bookId, Number(2n ** 19n - 1n), BigInt(n)],
    }),
    fetchIsOpened(chainId, bookId),
  ])

  return new Book({
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

export async function fetchMarket(
  chainId: CHAIN_IDS,
  tokenAddresses: `0x${string}`[],
  n = 100,
): Promise<Market> {
  if (tokenAddresses.length !== 2) {
    throw new Error('Invalid token pair')
  }

  const { quoteTokenAddress, baseTokenAddress } = getMarketId(chainId, [
    tokenAddresses[0]!,
    tokenAddresses[1]!,
  ])

  const [quoteCurrency, baseCurrency] = await Promise.all([
    fetchCurrency(chainId, quoteTokenAddress),
    fetchCurrency(chainId, baseTokenAddress),
  ])
  const [bidBook, askBook] = await Promise.all([
    getBook(chainId, quoteCurrency, baseCurrency, n),
    getBook(chainId, baseCurrency, quoteCurrency, n),
  ])

  return new Market({
    chainId,
    tokens: [quoteCurrency, baseCurrency],
    bidBook,
    askBook,
  })
}
