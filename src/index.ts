import { isAddressEqual } from 'viem'

import { fetchMarket } from './apis/market'
import { CHAIN_IDS } from './constants/chain'
import { Market } from './type'

/**
 * Get market information by chain id and token addresses
 * @param chainId - chain id
 * @param token0 - token0 address
 * @param token1 - token1 address
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
