import { getAddress, isAddressEqual, PublicClient } from 'viem'

import { CHAIN_IDS } from '../../../constants/chain-configs/chain'
import { MarketSnapshot } from '../types'
import { Subgraph } from '../../../constants/chain-configs/subgraph'
import { getQuoteToken } from '../../../views'
import { fetchTotalSupplyMap } from '../../currency/apis/total-supply'
import { getDailyStartTimestampInSeconds } from '../../../utils/time'
import { convertTokenToDecimal } from '../../../utils/bigint'

type BookDayDataDto = {
  volumeUSD: string
  close: string
  open: string
  book: {
    id: string
    totalValueLockedUSD: string
    price: string
    inversePrice: string
    lastTakenTimestamp: string
    base: {
      id: string
      name: string
      symbol: string
      decimals: string
      priceUSD: string
    }
    quote: {
      id: string
      name: string
      symbol: string
      decimals: string
      priceUSD: string
    }
    createdAtTimestamp: string
  }
}

export const fetchMarketSnapshot = async (
  publicClient: PublicClient,
  chainId: CHAIN_IDS,
  token0: `0x${string}`,
  token1: `0x${string}`,
  timestampInSeconds: number,
): Promise<MarketSnapshot> => {
  const dayStartTimestamp = getDailyStartTimestampInSeconds(timestampInSeconds)

  const {
    data: { bookDayDatas },
  } = await Subgraph.get<{
    data: {
      bookDayDatas: BookDayDataDto[]
    }
  }>(
    chainId,
    'getTopMarketSnapshot',
    'query getMarkets($date: Int!, $bases: [String!]!, $quotes: [String!]!) { bookDayDatas( first: 200 orderBy: volumeUSD orderDirection: desc where: {date: $date, book_: {base_in: $bases, quote_in: $quotes}} ) { volumeUSD open close book { id totalValueLockedUSD price inversePrice lastTakenTimestamp base { id name symbol decimals priceUSD } quote { id name symbol decimals priceUSD } createdAtTimestamp } } }',
    {
      date: dayStartTimestamp,
      bases: [token0, token1].map((address) => address.toLowerCase()),
      quotes: [token0, token1].map((address) => address.toLowerCase()),
    },
  )
  if (bookDayDatas.length >= 3) {
    // TODO: check fee policy if needed
    console.warn(
      `[fetchMarketSnapshot] too many bookDayDatas for ${token0}/${token1}`,
    )
  }

  const totalSupplyMap = await fetchTotalSupplyMap(
    publicClient,
    chainId,
    [token0, token1].map((address) => getAddress(address)),
  )

  const bidBook = bookDayDatas.find(({ book: { quote, base } }) =>
    isAddressEqual(
      getAddress(quote.id),
      getQuoteToken({
        chainId,
        token0: getAddress(base.id),
        token1: getAddress(quote.id),
      }),
    ),
  )
  const askBook = bookDayDatas.find(({ book: { quote, base } }) =>
    isAddressEqual(
      getAddress(base.id),
      getQuoteToken({
        chainId,
        token0: getAddress(quote.id),
        token1: getAddress(base.id),
      }),
    ),
  )
  if (bidBook && askBook) {
    const baseTotalSupply = convertTokenToDecimal(
      BigInt(totalSupplyMap[getAddress(bidBook.book.base.id)] ?? 0n),
      Number(bidBook.book.base.decimals),
    )
    const isBidNewer =
      Number(bidBook.book.lastTakenTimestamp) >=
      Number(askBook.book.lastTakenTimestamp)
    return {
      chainId,
      marketId: `${bidBook.book.base.symbol}/${bidBook.book.quote.symbol}`,
      base: {
        address: getAddress(bidBook.book.base.id),
        name: bidBook.book.base.name,
        symbol: bidBook.book.base.symbol,
        decimals: Number(bidBook.book.base.decimals),
      },
      quote: {
        address: getAddress(bidBook.book.quote.id),
        name: bidBook.book.quote.name,
        symbol: bidBook.book.quote.symbol,
        decimals: Number(bidBook.book.quote.decimals),
      },
      price: isBidNewer
        ? Number(bidBook.book.price)
        : Number(askBook.book.inversePrice),
      priceUSD: isBidNewer
        ? Number(bidBook.book.base.priceUSD)
        : Number(askBook.book.quote.priceUSD),
      volume24hUSD: Number(bidBook.volumeUSD) + Number(askBook.volumeUSD),
      totalValueLockedUSD:
        Number(bidBook.book.totalValueLockedUSD) +
        Number(askBook.book.totalValueLockedUSD),
      priceChange24h:
        isBidNewer && Number(bidBook.open) > 0
          ? Number(bidBook.close) / Number(bidBook.open) - 1
          : !isBidNewer && Number(askBook.close) > 0
            ? Number(askBook.open) / Number(askBook.close) - 1
            : 0,
      createdAtTimestamp: Math.min(
        Number(bidBook.book.createdAtTimestamp),
        Number(askBook.book.createdAtTimestamp),
      ),
      fdv:
        baseTotalSupply *
        (isBidNewer
          ? Number(bidBook.book.base.priceUSD)
          : Number(askBook.book.quote.priceUSD)),
      bidBookUpdatedAt: Number(bidBook.book.lastTakenTimestamp),
      askBookUpdatedAt: Number(askBook.book.lastTakenTimestamp),
    }
  } else if (bidBook) {
    const baseTotalSupply = convertTokenToDecimal(
      BigInt(totalSupplyMap[getAddress(bidBook.book.base.id)] ?? 0n),
      Number(bidBook.book.base.decimals),
    )
    return {
      chainId,
      marketId: `${bidBook.book.base.symbol}/${bidBook.book.quote.symbol}`,
      base: {
        address: getAddress(bidBook.book.base.id),
        name: bidBook.book.base.name,
        symbol: bidBook.book.base.symbol,
        decimals: Number(bidBook.book.base.decimals),
      },
      quote: {
        address: getAddress(bidBook.book.quote.id),
        name: bidBook.book.quote.name,
        symbol: bidBook.book.quote.symbol,
        decimals: Number(bidBook.book.quote.decimals),
      },
      price: Number(bidBook.book.price) || 0,
      priceUSD: Number(bidBook.book.base.priceUSD) || 0,
      volume24hUSD: Number(bidBook.volumeUSD) || 0,
      totalValueLockedUSD: Number(bidBook.book.totalValueLockedUSD) || 0,
      priceChange24h:
        Number(bidBook.open) > 0
          ? Number(bidBook.close) / Number(bidBook.open) - 1
          : 0,
      createdAtTimestamp: Number(bidBook.book.createdAtTimestamp) || 0,
      fdv: baseTotalSupply * Number(bidBook.book.base.priceUSD) || 0,
      bidBookUpdatedAt: Number(bidBook.book.lastTakenTimestamp) || 0,
      askBookUpdatedAt: 0,
    }
  } else if (askBook) {
    const baseTotalSupply = convertTokenToDecimal(
      BigInt(totalSupplyMap[getAddress(askBook.book.quote.id)] ?? 0n),
      Number(askBook.book.quote.decimals),
    )
    return {
      chainId,
      marketId: `${askBook.book.quote.symbol}/${askBook.book.base.symbol}`,
      base: {
        address: getAddress(askBook.book.quote.id),
        name: askBook.book.quote.name,
        symbol: askBook.book.quote.symbol,
        decimals: Number(askBook.book.quote.decimals),
      },
      quote: {
        address: getAddress(askBook.book.base.id),
        name: askBook.book.base.name,
        symbol: askBook.book.base.symbol,
        decimals: Number(askBook.book.base.decimals),
      },
      price: Number(askBook.book.inversePrice) || 0,
      priceUSD: Number(askBook.book.quote.priceUSD) || 0,
      volume24hUSD: Number(askBook.volumeUSD) || 0,
      totalValueLockedUSD: Number(askBook.book.totalValueLockedUSD) || 0,
      priceChange24h:
        Number(askBook.close) > 0
          ? Number(askBook.open) / Number(askBook.close) - 1
          : 0,
      createdAtTimestamp: Number(askBook.book.createdAtTimestamp) || 0,
      fdv: baseTotalSupply * Number(askBook.book.quote.priceUSD) || 0,
      bidBookUpdatedAt: 0,
      askBookUpdatedAt: Number(askBook.book.lastTakenTimestamp) || 0,
    }
  }
  throw new Error('No bookDayDatas found')
}

export const fetchMarketSnapshots = async (
  publicClient: PublicClient,
  chainId: CHAIN_IDS,
  timestampInSeconds: number,
): Promise<MarketSnapshot[]> => {
  const dayStartTimestamp = getDailyStartTimestampInSeconds(timestampInSeconds)
  const {
    data: { bookDayDatas },
  } = await Subgraph.get<{
    data: {
      bookDayDatas: BookDayDataDto[]
    }
  }>(
    chainId,
    'getTopMarketSnapshots',
    'query getMarkets($date: Int!) { bookDayDatas( first: 200 orderBy: volumeUSD orderDirection: desc where: {date: $date} ) { volumeUSD open close book { id totalValueLockedUSD price inversePrice lastTakenTimestamp base { id name symbol decimals priceUSD } quote { id name symbol decimals priceUSD } createdAtTimestamp } } }',
    {
      date: dayStartTimestamp,
    },
  )
  const bidBookDayDataList = bookDayDatas.filter(({ book: { quote, base } }) =>
    isAddressEqual(
      getAddress(quote.id),
      getQuoteToken({
        chainId,
        token0: getAddress(base.id),
        token1: getAddress(quote.id),
      }),
    ),
  )
  const askBookDayDataList = bookDayDatas.filter(({ book: { quote, base } }) =>
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
  const totalSupplyMap = await fetchTotalSupplyMap(
    publicClient,
    chainId,
    tokenAddresses,
  )

  return [
    ...bidBookDayDataList.map((bidBook) => {
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
      const askBook = askBookDayDataList.find(
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
      const baseTotalSupply = convertTokenToDecimal(
        BigInt(totalSupplyMap[baseCurrency.address] ?? 0n),
        baseCurrency.decimals,
      )
      const isBidNewer =
        Number(bidBook.book.lastTakenTimestamp) >=
        Number(askBook?.book.lastTakenTimestamp ?? 0)
      return {
        chainId,
        marketId: `${baseCurrency.symbol}/${quoteCurrency.symbol}`,
        base: baseCurrency,
        quote: quoteCurrency,
        price: isBidNewer
          ? Number(bidBook.book.price)
          : Number(askBook?.book.inversePrice),
        priceUSD: isBidNewer
          ? Number(bidBook.book.base.priceUSD)
          : Number(askBook?.book.quote.priceUSD),
        priceChange24h:
          isBidNewer && Number(bidBook.open) > 0
            ? Number(bidBook.close) / Number(bidBook.open) - 1
            : !isBidNewer && askBook && Number(askBook.close) > 0
              ? Number(askBook.open) / Number(askBook.close) - 1
              : 0,
        volume24hUSD: askBook
          ? Number(askBook.volumeUSD) + Number(bidBook.volumeUSD)
          : Number(bidBook.volumeUSD),
        totalValueLockedUSD: askBook
          ? Number(askBook.book.totalValueLockedUSD) +
            Number(bidBook.book.totalValueLockedUSD)
          : Number(bidBook.book.totalValueLockedUSD),
        createdAtTimestamp: askBook
          ? Math.min(
              Number(bidBook.book.createdAtTimestamp),
              Number(askBook.book.createdAtTimestamp),
            )
          : Number(bidBook.book.createdAtTimestamp),
        fdv: isBidNewer
          ? baseTotalSupply * Number(bidBook.book.base.priceUSD)
          : baseTotalSupply * Number(askBook?.book.quote.priceUSD),
        bidBookUpdatedAt: Number(bidBook.book.lastTakenTimestamp),
        askBookUpdatedAt: Number(askBook?.book.lastTakenTimestamp ?? 0),
      }
    }),
    ...askBookDayDataList.map((askBook) => {
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
      const bidBook = bidBookDayDataList.find(
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
      const baseTotalSupply = convertTokenToDecimal(
        BigInt(totalSupplyMap[baseCurrency.address] ?? 0n),
        baseCurrency.decimals,
      )
      const isBidNewer =
        Number(bidBook?.book.lastTakenTimestamp ?? 0) >=
        Number(askBook.book.lastTakenTimestamp)
      return {
        chainId,
        marketId: `${baseCurrency.symbol}/${quoteCurrency.symbol}`,
        base: baseCurrency,
        quote: quoteCurrency,
        price: isBidNewer
          ? Number(bidBook?.book.price)
          : Number(askBook.book.inversePrice),
        priceUSD: isBidNewer
          ? Number(bidBook?.book.base.priceUSD)
          : Number(askBook.book.quote.priceUSD),
        priceChange24h:
          isBidNewer && bidBook && Number(bidBook.open) > 0
            ? Number(bidBook.close) / Number(bidBook.open) - 1
            : !isBidNewer && Number(askBook.close) > 0
              ? Number(askBook.open) / Number(askBook.close) - 1
              : 0,
        volume24hUSD: bidBook
          ? Number(askBook.volumeUSD) + Number(bidBook.volumeUSD)
          : Number(askBook.volumeUSD),
        totalValueLockedUSD: bidBook
          ? Number(bidBook.book.totalValueLockedUSD) +
            Number(askBook.book.totalValueLockedUSD)
          : Number(askBook.book.totalValueLockedUSD),
        createdAtTimestamp: bidBook
          ? Math.min(
              Number(askBook.book.createdAtTimestamp),
              Number(bidBook.book.createdAtTimestamp),
            )
          : Number(askBook.book.createdAtTimestamp),
        fdv: isBidNewer
          ? baseTotalSupply * Number(bidBook?.book.base.priceUSD)
          : baseTotalSupply * Number(askBook.book.quote.priceUSD),
        bidBookUpdatedAt: Number(bidBook?.book.lastTakenTimestamp ?? 0),
        askBookUpdatedAt: Number(askBook.book.lastTakenTimestamp),
      }
    }),
  ]
    .filter(({ price }) => price > 0)
    .filter(
      (market, index, self) =>
        self.findIndex((m) => m.marketId === market.marketId) === index,
    )
}
