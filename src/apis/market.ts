import { getAddress, isAddressEqual } from 'viem'

import { CHAIN_IDS } from '../constants/chain'
import { Market } from '../model/market'
import { SUBGRAPH_URL } from '../constants/subgraph-url'
import { getBuiltGraphSDK } from '../.graphclient'
import { Book } from '../model/book'
import type { RawDepth } from '../model/depth'
import { getMarketId } from '../utils/market'

import { fetchCurrency } from './currency'

const { getBooks } = getBuiltGraphSDK()

export async function fetchMarket(
  chainId: CHAIN_IDS,
  tokenAddresses: `0x${string}`[],
  rpcUrl?: string,
): Promise<Market> {
  if (tokenAddresses.length !== 2) {
    throw new Error('Invalid token pair')
  }

  const { quoteTokenAddress, baseTokenAddress } = getMarketId(chainId, [
    tokenAddresses[0]!,
    tokenAddresses[1]!,
  ])

  const [
    quoteCurrency,
    baseCurrency,
    { books: bidBooks },
    { books: askBooks },
  ] = await Promise.all([
    fetchCurrency(chainId, quoteTokenAddress, rpcUrl),
    fetchCurrency(chainId, baseTokenAddress, rpcUrl),
    getBooks(
      {
        quoteTokenAddress: quoteTokenAddress.toLowerCase(),
        baseTokenAddress: baseTokenAddress.toLowerCase(),
      },
      {
        url: SUBGRAPH_URL[chainId],
      },
    ),
    getBooks(
      {
        quoteTokenAddress: baseTokenAddress.toLowerCase(),
        baseTokenAddress: quoteTokenAddress.toLowerCase(),
      },
      {
        url: SUBGRAPH_URL[chainId],
      },
    ),
  ])

  return new Market({
    chainId,
    tokens: [quoteCurrency, baseCurrency],
    books: [...bidBooks, ...askBooks].map((book) => {
      const isBid = isAddressEqual(
        getAddress(book.quote.id),
        quoteCurrency.address,
      )
      return new Book({
        id: BigInt(book.id),
        base: isBid ? baseCurrency : quoteCurrency,
        quote: isBid ? quoteCurrency : baseCurrency,
        unit: BigInt(book.unit),
        depths: book.depths
          .map((depth) => {
            const rawAmount = BigInt(depth.rawAmount)
            const tick = BigInt(depth.tick)
            return {
              bookId: String(book.id),
              unit: BigInt(book.unit),
              tick,
              rawAmount,
            } as RawDepth
          })
          .sort((a, b) => Number(b.tick) - Number(a.tick)),
      })
    }),
  })
}
