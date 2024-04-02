import { isAddressEqual } from 'viem'

import { fetchMarket } from './apis/market'
import { CHAIN_IDS } from './constants/chain'
import { Market } from './type'

export * from './type'

/**
 * Get market information by chain id and token addresses
 * @param chainId - chain id from {@link CHAIN_IDS}
 * @param token0 - token0 address
 * @param token1 - token1 address
 * @returns A market {@link Market}
 *
 * @example
 * import { getMarket } from '@clober-dex/v2-sdk'
 * import { arbitrumSepolia } from 'viem/chains'
 *
 * const market = await getMarket(
 *  arbitrumSepolia.id,
 *  '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
 *  '0x0000000000000000000000000000000000000000',
 * )
 */
export const getMarket = async (
  chainId: CHAIN_IDS,
  token0: `0x${string}`,
  token1: `0x${string}`,
): Promise<Market> => {
  if (isAddressEqual(token0, token1)) {
    throw new Error('Token0 and token1 must be different')
  }
  const market = await fetchMarket(chainId, [token0, token1])
  return {
    chainId,
    quote: market.quote,
    base: market.base,
    makerFee: market.makerFee,
    takerFee: market.takerFee,
    bids: market.bids,
    bidBookOpen: market.bidBookOpen,
    asks: market.asks,
    askBookOpen: market.askBookOpen,
  }
}
