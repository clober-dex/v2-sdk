import { formatUnits, getAddress, isAddressEqual, PublicClient } from 'viem'

import { CHAIN_IDS } from '../constants/chain'
import { Market } from '../model/market'
import { Book, BookDayDataDTO, TakeSampleDto } from '../model/book'
import { getMarketId } from '../utils/market'
import { toBookId } from '../utils/book-id'
import { calculateUnitSize } from '../utils/unit-size'
import type { Currency } from '../model/currency'
import { CONTRACT_ADDRESSES } from '../constants/addresses'
import { BOOK_VIEWER_ABI } from '../abis/core/book-viewer-abi'
import { fetchIsMarketOpened } from '../utils/open'
import { fetchCurrencyMap } from '../utils/currency'
import { Subgraph } from '../constants/subgraph'
import { MarketSnapshot } from '../type'
import { currentTimestampInSeconds } from '../utils/time'
import { getQuoteToken } from '../view'

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
    'query getBook($bookId: ID!) { book(id: $bookId) { depths(where: {unitAmount_gt: 0}) { tick unitAmount } } }',
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

export async function fetchMarket(
  publicClient: PublicClient,
  chainId: CHAIN_IDS,
  tokenAddresses: `0x${string}`[],
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
  const currencyMap = await fetchCurrencyMap(
    publicClient,
    chainId,
    [quoteTokenAddress, baseTokenAddress],
    useSubgraph,
  )
  const [quoteCurrency, baseCurrency] = [
    currencyMap[quoteTokenAddress],
    currencyMap[baseTokenAddress],
  ]
  const [bidBook, askBook] = await Promise.all([
    getBook(publicClient, chainId, quoteCurrency, baseCurrency, useSubgraph, n),
    getBook(publicClient, chainId, baseCurrency, quoteCurrency, useSubgraph, n),
  ])

  return new Market({
    chainId,
    tokens: [quoteCurrency, baseCurrency],
    bidBook,
    askBook,
  })
}

const calculate24hPriceChange = (
  chainId: CHAIN_IDS,
  firstTakenList: TakeSampleDto[],
  latestTakenList: TakeSampleDto[],
): number => {
  const filteredTakenList = [...firstTakenList, ...latestTakenList].filter(
    (take) => BigInt(take.inputAmount) > 0n && BigInt(take.outputAmount) > 0n,
  )
  if (filteredTakenList.length === 0) {
    return 0
  }
  const takenList = filteredTakenList
    .map((take) => {
      const inputAmount = Number(
        formatUnits(BigInt(take.inputAmount), Number(take.inputToken.decimals)),
      )
      const outputAmount = Number(
        formatUnits(
          BigInt(take.outputAmount),
          Number(take.outputToken.decimals),
        ),
      )
      return {
        timestamp: Number(take.timestamp),
        price: isAddressEqual(
          getQuoteToken({
            chainId,
            token0: getAddress(take.inputToken.id),
            token1: getAddress(take.outputToken.id),
          }),
          getAddress(take.inputToken.id),
        )
          ? inputAmount / outputAmount
          : outputAmount / inputAmount,
      }
    })
    .sort((a, b) => a.timestamp - b.timestamp)
  return (takenList[takenList.length - 1].price / takenList[0].price - 1) * 100
}

export const fetchTopMarketSnapshots = async (
  chainId: CHAIN_IDS,
): Promise<MarketSnapshot[]> => {
  const dayID = Math.floor(currentTimestampInSeconds() / 86400)
  const {
    data: { bookDayDatas },
  } = await Subgraph.get<{
    data: { bookDayDatas: BookDayDataDTO[] }
  }>(
    chainId,
    'getTopMarketSnapshots',
    'query getMarkets($date: Int!) { bookDayDatas( first: 1000 orderBy: volumeUSD orderDirection: desc where: {date: $date} ) { volumeUSD book { id volumeUSD price inversePrice latestTaken: takes( first: 1 orderBy: timestamp orderDirection: asc where: {timestamp_gte: $date} ) { timestamp inputToken { id name symbol decimals } outputToken { id name symbol decimals } inputAmount outputAmount } firstTaken: takes( first: 1 orderBy: timestamp orderDirection: desc where: {timestamp_gte: $date} ) { timestamp inputToken { id name symbol decimals } outputToken { id name symbol decimals } inputAmount outputAmount } base { id name symbol decimals } quote { id name symbol decimals } createdAtTimestamp } } }',
    {
      date: dayID,
    },
  )
  const bidBooks = bookDayDatas.filter(({ book: { quote, base } }) =>
    isAddressEqual(
      getAddress(quote.id),
      getQuoteToken({
        chainId,
        token0: getAddress(base.id),
        token1: getAddress(quote.id),
      }),
    ),
  )
  const askBooks = bookDayDatas.filter(({ book: { quote, base } }) =>
    isAddressEqual(
      getAddress(base.id),
      getQuoteToken({
        chainId,
        token0: getAddress(quote.id),
        token1: getAddress(base.id),
      }),
    ),
  )

  const mergedBooks = [
    ...bidBooks.map((bidBook) => {
      const quoteCurrency = {
        address: getAddress(bidBook.book.quote.id),
        name: bidBook.book.quote.name,
        symbol: bidBook.book.quote.symbol,
        decimals: Number(bidBook.book.quote.decimals),
      }
      const baseCurrency = {
        address: getAddress(bidBook.book.base.id),
        name: bidBook.book.base.name,
        symbol: bidBook.book.base.symbol,
        decimals: Number(bidBook.book.base.decimals),
      }
      const askBook = askBooks.find(
        (askBook) =>
          isAddressEqual(
            getAddress(askBook.book.quote.id),
            baseCurrency.address,
          ) &&
          isAddressEqual(
            getAddress(askBook.book.base.id),
            quoteCurrency.address,
          ),
      )
      return {
        chainId,
        marketId: `${baseCurrency.symbol}/${quoteCurrency.symbol}`,
        base: baseCurrency,
        quote: quoteCurrency,
        price: Number(bidBook.book.price),
        volume24hUSD: askBook
          ? Number(askBook.book.volumeUSD) + Number(bidBook.book.volumeUSD)
          : Number(bidBook.book.volumeUSD),
        priceChange24h: calculate24hPriceChange(
          chainId,
          askBook
            ? [...bidBook.book.firstTaken, ...askBook.book.firstTaken]
            : bidBook.book.firstTaken,
          askBook
            ? [...bidBook.book.latestTaken, ...askBook.book.latestTaken]
            : bidBook.book.latestTaken,
        ),
        createdAtTimestamp: askBook
          ? Math.min(
              Number(bidBook.book.createdAtTimestamp),
              Number(askBook.book.createdAtTimestamp),
            )
          : Number(bidBook.book.createdAtTimestamp),
      }
    }),
    ...askBooks.map((askBook) => {
      const quoteCurrency = {
        address: getAddress(askBook.book.quote.id),
        name: askBook.book.quote.name,
        symbol: askBook.book.quote.symbol,
        decimals: Number(askBook.book.quote.decimals),
      }
      const baseCurrency = {
        address: getAddress(askBook.book.base.id),
        name: askBook.book.base.name,
        symbol: askBook.book.base.symbol,
        decimals: Number(askBook.book.base.decimals),
      }
      const bidBook = bidBooks.find(
        (bidBook) =>
          isAddressEqual(
            getAddress(bidBook.book.quote.id),
            quoteCurrency.address,
          ) &&
          isAddressEqual(
            getAddress(bidBook.book.base.id),
            baseCurrency.address,
          ),
      )
      return {
        chainId,
        marketId: `${baseCurrency.symbol}/${quoteCurrency.symbol}`,
        base: baseCurrency,
        quote: quoteCurrency,
        price: Number(askBook.book.inversePrice),
        volume24hUSD: bidBook
          ? Number(askBook.book.volumeUSD) + Number(bidBook.book.volumeUSD)
          : Number(askBook.book.volumeUSD),
        priceChange24h: calculate24hPriceChange(
          chainId,
          bidBook
            ? [...askBook.book.firstTaken, ...bidBook.book.firstTaken]
            : askBook.book.firstTaken,
          bidBook
            ? [...askBook.book.latestTaken, ...bidBook.book.latestTaken]
            : askBook.book.latestTaken,
        ),
        createdAtTimestamp: bidBook
          ? Math.min(
              Number(askBook.book.createdAtTimestamp),
              Number(bidBook.book.createdAtTimestamp),
            )
          : Number(askBook.book.createdAtTimestamp),
      }
    }),
  ]
  return mergedBooks
    .filter(
      (market, index, self) =>
        self.findIndex((m) => m.marketId === market.marketId) === index,
    )
    .sort((a, b) => b.volume24hUSD - a.volume24hUSD)
}
