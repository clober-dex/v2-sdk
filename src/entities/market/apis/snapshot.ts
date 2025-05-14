import {
  formatUnits,
  getAddress,
  isAddressEqual,
  PublicClient,
  zeroAddress,
} from 'viem'

import { CHAIN_IDS } from '../../../constants/chain-configs/chain'
import { MarketSnapshot } from '../types'
import { currentTimestampInSeconds } from '../../../utils/time'
import { Subgraph } from '../../../constants/chain-configs/subgraph'
import { getQuoteToken } from '../../../views'
import { fetchTotalSupplyMap } from '../../currency/apis/total-supply'
import {
  STABLE_COIN_ADDRESSES,
  WETH_ADDRESS,
} from '../../../constants/chain-configs/currency'

type BookDayDataDto = {
  volumeUSD: string
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
    }
    quote: {
      id: string
      name: string
      symbol: string
      decimals: string
    }
    createdAtTimestamp: string
  }
}

type TokenDayDataDto = {
  token: { id: string }
  date: number
  priceUSD: string
}

export const fetchMarketSnapshots = async (
  publicClient: PublicClient,
  chainId: CHAIN_IDS,
): Promise<MarketSnapshot[]> => {
  const dayID = Math.floor(currentTimestampInSeconds() / 86400)
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
    'query getMarkets($date: Int!) { bookDayDatas( first: 200 orderBy: volumeUSD orderDirection: desc where: {date: $date} ) { volumeUSD book { id totalValueLockedUSD price inversePrice base { id name symbol decimals } quote { id name symbol decimals } createdAtTimestamp } } }',
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

  const {
    data: { tokenDayDatas },
  } = await Subgraph.get<{
    data: {
      tokenDayDatas: TokenDayDataDto[]
    }
  }>(
    chainId,
    'getYesterdayUSDPrice',
    'query getYesterdayUSDPrice($date: Int!, $tokenAddresses: [Bytes!]!) { tokenDayDatas(where: {token_in: $tokenAddresses, date: $date}) { token { id } date priceUSD } }',
    {
      date: dayStartTimestamp - 86400,
      tokenAddresses: tokenAddresses.map((address) => address.toLowerCase()),
    },
  )

  const yesterDayPriceMap = tokenDayDatas.reduce(
    (acc, { token, priceUSD }) => {
      acc[getAddress(token.id)] = Number(priceUSD)
      return acc
    },
    {} as Record<`0x${string}`, number>,
  )
  const stableCoinAddresses = new Set(
    STABLE_COIN_ADDRESSES[chainId].map((address) => getAddress(address)),
  )

  const mergedBooks = [
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
        baseTotalSupply,
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
        baseTotalSupply,
      }
    }),
  ].filter(
    (market, index, self) =>
      self.findIndex((m) => m.marketId === market.marketId) === index,
  )

  const currentPriceMap: Record<`0x${string}`, number> = {
    ...Object.fromEntries(
      STABLE_COIN_ADDRESSES[chainId].map((addr) => [getAddress(addr), 1]),
    ),
  }
  const priceSourceTVL: Record<`0x${string}`, number> = {
    ...Object.fromEntries(
      STABLE_COIN_ADDRESSES[chainId].map((addr) => [
        getAddress(addr),
        Number.MAX_SAFE_INTEGER,
      ]),
    ),
  }

  // Step 1: find best stablecoin-ETH pair (highest TVL)
  const ethAnchors = mergedBooks
    .filter(
      (book) =>
        stableCoinAddresses.has(book.quote.address) &&
        (isAddressEqual(book.base.address, zeroAddress) ||
          isAddressEqual(book.base.address, WETH_ADDRESS[chainId])),
    )
    .sort((a, b) => b.totalValueLockedUSD - a.totalValueLockedUSD)

  if (ethAnchors.length > 0) {
    const ethBook = ethAnchors[0]
    currentPriceMap[ethBook.base.address] = ethBook.price
    priceSourceTVL[ethBook.base.address] = ethBook.totalValueLockedUSD
  }

  // Step 2: propagate prices via BFS
  const queue = Object.entries(currentPriceMap).map(([token, priceUSD]) => ({
    token,
    priceUSD,
  }))

  while (queue.length > 0) {
    const { token, priceUSD } = queue.shift()!

    mergedBooks.forEach((book) => {
      if (book.totalValueLockedUSD < 100) {
        return
      }

      const base = getAddress(book.base.address)
      const quote = getAddress(book.quote.address)

      if (isAddressEqual(quote, getAddress(token))) {
        const basePriceUSD = priceUSD * book.price
        const prevTVL = priceSourceTVL[base] ?? 0
        if (
          book.totalValueLockedUSD > prevTVL ||
          currentPriceMap[base] === undefined
        ) {
          currentPriceMap[base] = basePriceUSD
          priceSourceTVL[base] = book.totalValueLockedUSD
          queue.push({ token: base, priceUSD: basePriceUSD })
        }
      } else if (isAddressEqual(base, getAddress(token))) {
        const quotePriceUSD = priceUSD * book.price
        const prevTVL = priceSourceTVL[quote] ?? 0
        if (
          book.totalValueLockedUSD > prevTVL ||
          currentPriceMap[quote] === undefined
        ) {
          currentPriceMap[quote] = quotePriceUSD
          priceSourceTVL[quote] = book.totalValueLockedUSD
          queue.push({ token: quote, priceUSD: quotePriceUSD })
        }
      }
    })
  }

  return mergedBooks
    .map((book) => {
      if (
        !currentPriceMap[book.base.address] ||
        !yesterDayPriceMap[book.base.address]
      ) {
        return null
      }
      return {
        chainId: book.chainId,
        marketId: book.marketId,
        base: book.base,
        quote: book.quote,
        price: book.price,
        priceUSD: currentPriceMap[book.base.address],
        priceChange24h:
          (currentPriceMap[book.base.address] /
            yesterDayPriceMap[book.base.address] -
            1) *
          100,
        volume24hUSD: book.volume24hUSD,
        totalValueLockedUSD: book.totalValueLockedUSD,
        createdAtTimestamp: book.createdAtTimestamp,
        fdv: book.baseTotalSupply * currentPriceMap[book.base.address],
      }
    })
    .filter((market): market is MarketSnapshot => market !== null)
}
