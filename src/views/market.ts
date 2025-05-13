import { createPublicClient, getAddress, http, isAddressEqual } from 'viem'

import { CHAIN_IDS, CHAIN_MAP } from '../constants/chain'
import { DefaultReadContractOptions, Market, MarketSnapshot } from '../types'
import { fetchMarket } from '../entities/market/apis'
import { fetchMarketSnapshots } from '../entities/market/apis/snapshot'
import { getMarketId } from '../entities/market/utils/market-id'

/**
 * Retrieves the quote token address for a given chain and a pair of tokens.
 *
 * @param chainId - chain id from {@link CHAIN_IDS}
 * @param token0 - token0 address
 * @param token1 - token1 address
 * @returns {string} The address of the quote token.
 *
 * @example
 * import { getQuoteToken } from '@clober/v2-sdk'
 *
 * const quote = await getQuoteToken({
 *   chainId: 421614,
 *   token0: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
 *   token1: '0x0000000000000000000000000000000000000000',
 * })
 */
export const getQuoteToken = ({
  chainId,
  token0,
  token1,
}: {
  chainId: CHAIN_IDS
  token0: `0x${string}`
  token1: `0x${string}`
}): `0x${string}` => {
  return getAddress(getMarketId(chainId, [token0, token1]).quoteTokenAddress)
}

/**
 * Get market information by chain id and token addresses
 * @param chainId - chain id from {@link CHAIN_IDS}
 * @param token0 - token0 address
 * @param token1 - token1 address
 * @param options {@link DefaultReadContractOptions} options.
 * @param options.n - number of depth levels to fetch
 * @returns A market {@link Market}
 *
 * @example
 * import { getMarket } from '@clober/v2-sdk'
 *
 * const market = await getMarket({
 *   chainId: 421614,
 *   token0: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
 *   token1: '0x0000000000000000000000000000000000000000',
 * })
 */
export const getMarket = async ({
  chainId,
  token0,
  token1,
  options,
}: {
  chainId: CHAIN_IDS
  token0: `0x${string}`
  token1: `0x${string}`
  options?: {
    n?: number
    useSubgraph?: boolean
  } & DefaultReadContractOptions
}): Promise<Market> => {
  if (isAddressEqual(token0, token1)) {
    throw new Error('Token0 and token1 must be different')
  }
  const publicClient = createPublicClient({
    chain: CHAIN_MAP[chainId],
    transport: options?.rpcUrl ? http(options.rpcUrl) : http(),
  })
  const market = await fetchMarket(
    publicClient,
    chainId,
    [token0, token1],
    !!(options && options.useSubgraph),
    options?.n,
  )
  return market.toJson()
}

export const getMarketSnapshots = async ({
  chainId,
}: {
  chainId: CHAIN_IDS
}): Promise<MarketSnapshot[]> => {
  return fetchMarketSnapshots(chainId)
}
