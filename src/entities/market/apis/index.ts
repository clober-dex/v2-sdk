import { PublicClient } from 'viem'

import { CHAIN_IDS } from '../../../constants/chain-configs/chain'
import { MarketModel } from '../model'
import { getMarketId } from '../utils/market-id'
import { fetchCurrencyMap } from '../../currency/apis'
import { fetchBook } from '../../book/apis'

export async function fetchMarket(
  publicClient: PublicClient,
  chainId: CHAIN_IDS,
  tokenAddresses: `0x${string}`[],
  useSubgraph: boolean,
): Promise<MarketModel> {
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
    fetchBook(publicClient, chainId, quoteCurrency, baseCurrency, useSubgraph),
    fetchBook(publicClient, chainId, baseCurrency, quoteCurrency, useSubgraph),
  ])

  return new MarketModel({
    chainId,
    tokens: [quoteCurrency, baseCurrency],
    bidBook,
    askBook,
  })
}
