import { PublicClient } from 'viem'

import { CHAIN_IDS } from '../constants/chain'
import { Market } from '../model/market'
import { Book } from '../model/book'
import { getMarketId } from '../utils/market'
import { toBookId } from '../utils/book-id'
import { calculateUnitSize } from '../utils/unit-size'
import type { Currency } from '../model/currency'
import { CONTRACT_ADDRESSES } from '../constants/addresses'
import { BOOK_VIEWER_ABI } from '../abis/core/book-viewer-abi'
import { fetchIsMarketOpened } from '../utils/open'
import { fetchCurrency } from '../utils/currency'
import { Subgraph } from '../constants/subgraph'
import { FeePolicy } from '../model/fee-policy'

const fetchBookFromSubgraph = async (chainId: CHAIN_IDS, bookId: string) => {
  return Subgraph.get<{
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
    'query getBook($bookId: ID!) { book(id: $bookId){ depths { tick unitAmount } } }',
    {
      bookId,
    },
  )
}

const getBook = async (
  publicClient: PublicClient,
  chainId: CHAIN_IDS,
  quoteCurrency: Currency,
  baseCurrency: Currency,
  makerFeePolicy: FeePolicy,
  takerFeePolicy: FeePolicy,
  useSubgraph: boolean,
  n: number,
): Promise<Book> => {
  const unitSize = await calculateUnitSize(publicClient, chainId, quoteCurrency)
  const bookId = toBookId(
    quoteCurrency.address,
    baseCurrency.address,
    makerFeePolicy,
    takerFeePolicy,
    unitSize,
  )
  if (useSubgraph) {
    const {
      data: { book },
    } = await fetchBookFromSubgraph(chainId, bookId.toString())
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
      takerFeePolicy,
      makerFeePolicy,
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
    takerFeePolicy,
    makerFeePolicy,
  })
}

export async function fetchMarket(
  publicClient: PublicClient,
  chainId: CHAIN_IDS,
  tokenAddresses: `0x${string}`[],
  makerFeePolicy: FeePolicy,
  takerFeePolicy: FeePolicy,
  useSubgraph: boolean,
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
    fetchCurrency(publicClient, chainId, quoteTokenAddress),
    fetchCurrency(publicClient, chainId, baseTokenAddress),
  ])
  const [bidBook, askBook] = await Promise.all([
    getBook(
      publicClient,
      chainId,
      quoteCurrency,
      baseCurrency,
      makerFeePolicy,
      takerFeePolicy,
      useSubgraph,
      n,
    ),
    getBook(
      publicClient,
      chainId,
      baseCurrency,
      quoteCurrency,
      makerFeePolicy,
      takerFeePolicy,
      useSubgraph,
      n,
    ),
  ])

  return new Market({
    chainId,
    tokens: [quoteCurrency, baseCurrency],
    bidBook,
    askBook,
  })
}
