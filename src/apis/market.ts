import { getAddress, isAddressEqual } from 'viem'

import { CHAIN_IDS } from '../constants/chain'
import { Market } from '../model/market'
import { Book, BookDto } from '../model/book'
import type { RawDepth } from '../model/depth'
import { getMarketId } from '../utils/market'

import { fetchCurrency } from './currency'
import { fetchSubgraph } from './subgraph'

const getBooks = async (
  chainId: CHAIN_IDS,
  baseTokenAddress: `0x${string}`,
  quoteTokenAddress: `0x${string}`,
) => {
  return fetchSubgraph<{
    data: {
      books: BookDto[]
    }
  }>(
    chainId,
    'getBooks',
    'query getBooks($baseTokenAddress: String!, $quoteTokenAddress: String!) { books( where: {base: $baseTokenAddress, quote: $quoteTokenAddress, makerPolicy: "8888308", takerPolicy: "8889608", hooks: "0x0000000000000000000000000000000000000000"} ) { id base { id name symbol decimals } quote { id name symbol decimals } unit depths { tick price rawAmount } } }',
    {
      baseTokenAddress: baseTokenAddress.toLowerCase(),
      quoteTokenAddress: quoteTokenAddress.toLowerCase(),
    },
  )
}

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
    {
      data: { books: bidBooks },
    },
    {
      data: { books: askBooks },
    },
  ] = await Promise.all([
    fetchCurrency(chainId, quoteTokenAddress, rpcUrl),
    fetchCurrency(chainId, baseTokenAddress, rpcUrl),
    getBooks(chainId, quoteTokenAddress, baseTokenAddress),
    getBooks(chainId, baseTokenAddress, quoteTokenAddress),
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
