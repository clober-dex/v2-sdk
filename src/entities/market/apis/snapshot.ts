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

type BookDto = {
  price: string
  inversePrice: string
  totalValueLockedUSD: string
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
}

export const fetchMarketSnapshot = async (
  publicClient: PublicClient,
  chainId: CHAIN_IDS,
  token0: `0x${string}`,
  token1: `0x${string}`,
  timestampInSeconds: number,
): Promise<MarketSnapshot | null> => {
  const dayStartTimestamp = getDailyStartTimestampInSeconds(timestampInSeconds)

  const {
    data: { books, bookDayDatas },
  } = await Subgraph.get<{
    data: {
      books: BookDto[]
      bookDayDatas: BookDayDataDto[]
    }
  }>(
    chainId,
    'getTopMarketSnapshot',
    'query getMarkets($date: Int!, $bases: [String!]!, $quotes: [String!]!) { books: books(where: {base_in: $bases, quote_in: $quotes}) { price inversePrice totalValueLockedUSD lastTakenTimestamp base { id name symbol decimals priceUSD } quote { id name symbol decimals priceUSD } } bookDayDatas( first: 200 orderBy: volumeUSD orderDirection: desc where: {date: $date, book_: {base_in: $bases, quote_in: $quotes}} ) { volumeUSD open close book { id totalValueLockedUSD price inversePrice lastTakenTimestamp base { id name symbol decimals priceUSD } quote { id name symbol decimals priceUSD } createdAtTimestamp } } }',
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
    return null
  }

  const totalSupplyMap = await fetchTotalSupplyMap(
    publicClient,
    chainId,
    [token0, token1].map((address) => getAddress(address)),
  )

  const dailyBidBookData = bookDayDatas.find(({ book: { quote, base } }) =>
    isAddressEqual(
      getAddress(quote.id),
      getQuoteToken({
        chainId,
        token0: getAddress(base.id),
        token1: getAddress(quote.id),
      }),
    ),
  )
  const dailyAskBookData = bookDayDatas.find(({ book: { quote, base } }) =>
    isAddressEqual(
      getAddress(base.id),
      getQuoteToken({
        chainId,
        token0: getAddress(quote.id),
        token1: getAddress(base.id),
      }),
    ),
  )
  if (dailyBidBookData && dailyAskBookData) {
    const baseTotalSupply = convertTokenToDecimal(
      BigInt(totalSupplyMap[getAddress(dailyBidBookData.book.base.id)] ?? 0n),
      Number(dailyBidBookData.book.base.decimals),
    )
    const isBidNewer =
      Number(dailyBidBookData.book.lastTakenTimestamp) >=
      Number(dailyAskBookData.book.lastTakenTimestamp)
    return {
      chainId,
      marketId: `${dailyBidBookData.book.base.symbol}/${dailyBidBookData.book.quote.symbol}`,
      base: {
        address: getAddress(dailyBidBookData.book.base.id),
        name: dailyBidBookData.book.base.name,
        symbol: dailyBidBookData.book.base.symbol,
        decimals: Number(dailyBidBookData.book.base.decimals),
      },
      quote: {
        address: getAddress(dailyBidBookData.book.quote.id),
        name: dailyBidBookData.book.quote.name,
        symbol: dailyBidBookData.book.quote.symbol,
        decimals: Number(dailyBidBookData.book.quote.decimals),
      },
      price: isBidNewer
        ? Number(dailyBidBookData.book.price)
        : Number(dailyAskBookData.book.inversePrice),
      priceUSD: isBidNewer
        ? Number(dailyBidBookData.book.base.priceUSD)
        : Number(dailyAskBookData.book.quote.priceUSD),
      volume24hUSD:
        Number(dailyBidBookData.volumeUSD) + Number(dailyAskBookData.volumeUSD),
      totalValueLockedUSD:
        Number(dailyBidBookData.book.totalValueLockedUSD) +
        Number(dailyAskBookData.book.totalValueLockedUSD),
      priceChange24h:
        isBidNewer && Number(dailyBidBookData.open) > 0
          ? Number(dailyBidBookData.close) / Number(dailyBidBookData.open) - 1
          : !isBidNewer && Number(dailyAskBookData.close) > 0
            ? Number(dailyAskBookData.open) / Number(dailyAskBookData.close) - 1
            : 0,
      createdAtTimestamp: Math.min(
        Number(dailyBidBookData.book.createdAtTimestamp),
        Number(dailyAskBookData.book.createdAtTimestamp),
      ),
      fdv:
        baseTotalSupply *
        (isBidNewer
          ? Number(dailyBidBookData.book.base.priceUSD)
          : Number(dailyAskBookData.book.quote.priceUSD)),
      bidBookUpdatedAt: Number(dailyBidBookData.book.lastTakenTimestamp),
      askBookUpdatedAt: Number(dailyAskBookData.book.lastTakenTimestamp),
    }
  } else if (dailyBidBookData) {
    const baseTotalSupply = convertTokenToDecimal(
      BigInt(totalSupplyMap[getAddress(dailyBidBookData.book.base.id)] ?? 0n),
      Number(dailyBidBookData.book.base.decimals),
    )
    return {
      chainId,
      marketId: `${dailyBidBookData.book.base.symbol}/${dailyBidBookData.book.quote.symbol}`,
      base: {
        address: getAddress(dailyBidBookData.book.base.id),
        name: dailyBidBookData.book.base.name,
        symbol: dailyBidBookData.book.base.symbol,
        decimals: Number(dailyBidBookData.book.base.decimals),
      },
      quote: {
        address: getAddress(dailyBidBookData.book.quote.id),
        name: dailyBidBookData.book.quote.name,
        symbol: dailyBidBookData.book.quote.symbol,
        decimals: Number(dailyBidBookData.book.quote.decimals),
      },
      price: Number(dailyBidBookData.book.price) || 0,
      priceUSD: Number(dailyBidBookData.book.base.priceUSD) || 0,
      volume24hUSD: Number(dailyBidBookData.volumeUSD) || 0,
      totalValueLockedUSD:
        Number(dailyBidBookData.book.totalValueLockedUSD) || 0,
      priceChange24h:
        Number(dailyBidBookData.open) > 0
          ? Number(dailyBidBookData.close) / Number(dailyBidBookData.open) - 1
          : 0,
      createdAtTimestamp: Number(dailyBidBookData.book.createdAtTimestamp) || 0,
      fdv: baseTotalSupply * Number(dailyBidBookData.book.base.priceUSD) || 0,
      bidBookUpdatedAt: Number(dailyBidBookData.book.lastTakenTimestamp) || 0,
      askBookUpdatedAt: 0,
    }
  } else if (dailyAskBookData) {
    const baseTotalSupply = convertTokenToDecimal(
      BigInt(totalSupplyMap[getAddress(dailyAskBookData.book.quote.id)] ?? 0n),
      Number(dailyAskBookData.book.quote.decimals),
    )
    return {
      chainId,
      marketId: `${dailyAskBookData.book.quote.symbol}/${dailyAskBookData.book.base.symbol}`,
      base: {
        address: getAddress(dailyAskBookData.book.quote.id),
        name: dailyAskBookData.book.quote.name,
        symbol: dailyAskBookData.book.quote.symbol,
        decimals: Number(dailyAskBookData.book.quote.decimals),
      },
      quote: {
        address: getAddress(dailyAskBookData.book.base.id),
        name: dailyAskBookData.book.base.name,
        symbol: dailyAskBookData.book.base.symbol,
        decimals: Number(dailyAskBookData.book.base.decimals),
      },
      price: Number(dailyAskBookData.book.inversePrice) || 0,
      priceUSD: Number(dailyAskBookData.book.quote.priceUSD) || 0,
      volume24hUSD: Number(dailyAskBookData.volumeUSD) || 0,
      totalValueLockedUSD:
        Number(dailyAskBookData.book.totalValueLockedUSD) || 0,
      priceChange24h:
        Number(dailyAskBookData.close) > 0
          ? Number(dailyAskBookData.open) / Number(dailyAskBookData.close) - 1
          : 0,
      createdAtTimestamp: Number(dailyAskBookData.book.createdAtTimestamp) || 0,
      fdv: baseTotalSupply * Number(dailyAskBookData.book.quote.priceUSD) || 0,
      bidBookUpdatedAt: 0,
      askBookUpdatedAt: Number(dailyAskBookData.book.lastTakenTimestamp) || 0,
    }
  }

  if (books.length >= 3) {
    // TODO: check fee policy if needed
    console.warn(`[fetchMarketSnapshot] too many books for ${token0}/${token1}`)
    return null
  }

  const bidBook = books.find(({ quote, base }) =>
    isAddressEqual(
      getAddress(quote.id),
      getQuoteToken({
        chainId,
        token0: getAddress(base.id),
        token1: getAddress(quote.id),
      }),
    ),
  )

  const askBook = books.find(({ quote, base }) =>
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
      BigInt(totalSupplyMap[getAddress(bidBook.base.id)] ?? 0n),
      Number(bidBook.base.decimals),
    )
    return {
      chainId,
      marketId: `${bidBook.base.symbol}/${bidBook.quote.symbol}`,
      base: {
        address: getAddress(bidBook.base.id),
        name: bidBook.base.name,
        symbol: bidBook.base.symbol,
        decimals: Number(bidBook.base.decimals),
      },
      quote: {
        address: getAddress(bidBook.quote.id),
        name: bidBook.quote.name,
        symbol: bidBook.quote.symbol,
        decimals: Number(bidBook.quote.decimals),
      },
      price: Number(bidBook.price),
      priceUSD: Number(bidBook.base.priceUSD),
      volume24hUSD: 0,
      totalValueLockedUSD:
        Number(bidBook.totalValueLockedUSD) +
        Number(askBook.totalValueLockedUSD),
      priceChange24h: 0,
      createdAtTimestamp: Math.min(
        Number(bidBook.lastTakenTimestamp),
        Number(askBook.lastTakenTimestamp),
      ),
      fdv: baseTotalSupply * Number(bidBook.quote.priceUSD),
      bidBookUpdatedAt: Number(bidBook.lastTakenTimestamp),
      askBookUpdatedAt: Number(askBook.lastTakenTimestamp),
    }
  } else if (bidBook) {
    const baseTotalSupply = convertTokenToDecimal(
      BigInt(totalSupplyMap[getAddress(bidBook.base.id)] ?? 0n),
      Number(bidBook.base.decimals),
    )
    return {
      chainId,
      marketId: `${bidBook.base.symbol}/${bidBook.quote.symbol}`,
      base: {
        address: getAddress(bidBook.base.id),
        name: bidBook.base.name,
        symbol: bidBook.base.symbol,
        decimals: Number(bidBook.base.decimals),
      },
      quote: {
        address: getAddress(bidBook.quote.id),
        name: bidBook.quote.name,
        symbol: bidBook.quote.symbol,
        decimals: Number(bidBook.quote.decimals),
      },
      price: Number(bidBook.price),
      priceUSD: Number(bidBook.base.priceUSD),
      volume24hUSD: 0,
      totalValueLockedUSD: Number(bidBook.totalValueLockedUSD),
      priceChange24h: 0,
      createdAtTimestamp: Number(bidBook.lastTakenTimestamp),
      fdv: baseTotalSupply * Number(bidBook.quote.priceUSD),
      bidBookUpdatedAt: Number(bidBook.lastTakenTimestamp),
      askBookUpdatedAt: 0,
    }
  } else if (askBook) {
    const baseTotalSupply = convertTokenToDecimal(
      BigInt(totalSupplyMap[getAddress(askBook.quote.id)] ?? 0n),
      Number(askBook.quote.decimals),
    )
    return {
      chainId,
      marketId: `${askBook.quote.symbol}/${askBook.base.symbol}`,
      base: {
        address: getAddress(askBook.quote.id),
        name: askBook.quote.name,
        symbol: askBook.quote.symbol,
        decimals: Number(askBook.quote.decimals),
      },
      quote: {
        address: getAddress(askBook.base.id),
        name: askBook.base.name,
        symbol: askBook.base.symbol,
        decimals: Number(askBook.base.decimals),
      },
      price: Number(askBook.inversePrice),
      priceUSD: Number(askBook.quote.priceUSD),
      volume24hUSD: 0,
      totalValueLockedUSD: Number(askBook.totalValueLockedUSD),
      priceChange24h: 0,
      createdAtTimestamp: Number(askBook.lastTakenTimestamp),
      fdv: baseTotalSupply * Number(askBook.quote.priceUSD),
      bidBookUpdatedAt: 0,
      askBookUpdatedAt: Number(askBook.lastTakenTimestamp),
    }
  }
  return null
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
    .filter(({ priceUSD }) => priceUSD > 0)
    .filter(
      (market, index, self) =>
        self.findIndex((m) => m.marketId === market.marketId) === index,
    )
}
