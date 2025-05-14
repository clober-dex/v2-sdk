import { formatUnits, getAddress, isAddressEqual, PublicClient } from 'viem'

import { CHAIN_IDS } from '../../../constants/chain-configs/chain'
import { MarketSnapshot } from '../types'
import { Subgraph } from '../../../constants/chain-configs/subgraph'
import { getQuoteToken } from '../../../views'
import { fetchTotalSupplyMap } from '../../currency/apis/total-supply'

type BookDayDataDto = {
  volumeUSD: string
  close: string
  open: string
  book: {
    id: string
    totalValueLockedUSD: string
    price: string
    inversePrice: string
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

export const fetchMarketSnapshots = async (
  publicClient: PublicClient,
  chainId: CHAIN_IDS,
  timestampInSeconds: number,
): Promise<MarketSnapshot[]> => {
  const dayID = Math.floor(timestampInSeconds / 86400)
  const dayStartTimestamp = dayID * 86400
  const {
    data: { bookDayDatas },
  } = await Subgraph.get<{
    data: {
      bookDayDatas: BookDayDataDto[]
    }
  }>(
    chainId,
    'getTopMarketSnapshots',
    'query getMarkets($date: Int!) { bookDayDatas( first: 200 orderBy: volumeUSD orderDirection: desc where: {date: $date} ) { volumeUSD open close book { id totalValueLockedUSD price inversePrice base { id name symbol decimals priceUSD } quote { id name symbol decimals priceUSD } createdAtTimestamp } } }',
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
      const askBookDayData = askBookDayDataList.find(
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
      const baseTotalSupply = Number(
        formatUnits(
          BigInt(totalSupplyMap[baseCurrency.address] ?? 0n),
          baseCurrency.decimals,
        ),
      )
      return {
        chainId,
        marketId: `${baseCurrency.symbol}/${quoteCurrency.symbol}`,
        base: baseCurrency,
        quote: quoteCurrency,
        price: Number(bidBook.book.price),
        priceUSD: Number(bidBook.book.base.priceUSD),
        priceChange24h:
          (Number(bidBook.close) / Number(bidBook.open) - 1) * 100,
        volume24hUSD: askBookDayData
          ? Number(askBookDayData.volumeUSD) + Number(bidBook.volumeUSD)
          : Number(bidBook.volumeUSD),
        totalValueLockedUSD: askBookDayData
          ? Number(askBookDayData.book.totalValueLockedUSD) +
            Number(bidBook.book.totalValueLockedUSD)
          : Number(bidBook.book.totalValueLockedUSD),
        createdAtTimestamp: askBookDayData
          ? Math.min(
              Number(bidBook.book.createdAtTimestamp),
              Number(askBookDayData.book.createdAtTimestamp),
            )
          : Number(bidBook.book.createdAtTimestamp),
        fdv: baseTotalSupply * Number(bidBook.book.base.priceUSD),
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
      const baseTotalSupply = Number(
        formatUnits(
          BigInt(totalSupplyMap[baseCurrency.address] ?? 0n),
          baseCurrency.decimals,
        ),
      )
      return {
        chainId,
        marketId: `${baseCurrency.symbol}/${quoteCurrency.symbol}`,
        base: baseCurrency,
        quote: quoteCurrency,
        price: Number(askBook.book.inversePrice),
        priceUSD: Number(askBook.book.quote.priceUSD),
        priceChange24h: Number(askBook.open) / Number(askBook.close) - 1,
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
        fdv: baseTotalSupply * Number(askBook.book.quote.priceUSD),
      }
    }),
  ]
    .filter(({ priceUSD }) => priceUSD > 0)
    .filter(
      (market, index, self) =>
        self.findIndex((m) => m.marketId === market.marketId) === index,
    )
}
