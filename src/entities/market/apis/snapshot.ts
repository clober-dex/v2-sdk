import { formatUnits, getAddress, isAddressEqual } from 'viem'

import { CHAIN_IDS } from '../../../constants/chain'
import { MarketSnapshot } from '../../../types'
import { currentTimestampInSeconds } from '../../../utils/time'
import { Subgraph } from '../../../constants/subgraph'
import { getQuoteToken } from '../../../views'

type TakeSampleDto = {
  timestamp: string
  inputToken: {
    id: string
    name: string
    symbol: string
    decimals: string
  }
  outputToken: {
    id: string
    name: string
    symbol: string
    decimals: string
  }
  inputAmount: string
  outputAmount: string
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

export const fetchMarketSnapshots = async (
  chainId: CHAIN_IDS,
): Promise<MarketSnapshot[]> => {
  const dayID = Math.floor(currentTimestampInSeconds() / 86400)
  const {
    data: { bookDayDatas },
  } = await Subgraph.get<{
    data: {
      bookDayDatas: {
        volumeUSD: string
        book: {
          id: string
          volumeUSD: string
          price: string
          inversePrice: string
          latestTaken: TakeSampleDto[]
          firstTaken: TakeSampleDto[]
          base: {
            id: string
            name: string
            symbol: string
            decimals: string
          }
          quote: {
            id: string
            name: string
            symbol: string
            decimals: string
          }
          createdAtTimestamp: string
        }
      }[]
    }
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
  const tokenAddresses = [
    ...new Set(
      bookDayDatas
        .map(({ book: { base, quote } }) => [
          getAddress(base.id),
          getAddress(quote.id),
        ])
        .flat(),
    ),
  ]

  const {
    data: { tokenDayDatas },
  } = await Subgraph.get<{
    data: {
      tokenDayDatas: {
        token: { id: string }
        date: number
        priceUSD: string
      }[]
    }
  }>(
    chainId,
    'getTokenUSDPrices',
    'query getTokenUSDPrices($date: Int!, $tokenAddresses: [Bytes!]!) { tokenDayDatas(where: {token_in: $tokenAddresses, date: $date}) { token { id } date priceUSD } }',
    {
      date: dayID,
      tokenAddresses: tokenAddresses.map((address) => address.toLowerCase()),
    },
  )
  const priceUSDMap = tokenDayDatas.reduce(
    (acc, { token, priceUSD }) => {
      acc[getAddress(token.id)] = Number(priceUSD)
      return acc
    },
    {} as Record<`0x${string}`, number>,
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
        priceUSD:
          Number(bidBook.book.price) *
          Number(priceUSDMap[quoteCurrency.address] ?? 0),
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
        address: getAddress(askBook.book.base.id),
        name: askBook.book.base.name,
        symbol: askBook.book.base.symbol,
        decimals: Number(askBook.book.base.decimals),
      }
      const baseCurrency = {
        address: getAddress(askBook.book.quote.id),
        name: askBook.book.quote.name,
        symbol: askBook.book.quote.symbol,
        decimals: Number(askBook.book.quote.decimals),
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
        priceUSD:
          Number(askBook.book.inversePrice) *
          Number(priceUSDMap[quoteCurrency.address] ?? 0),
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
