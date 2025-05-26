import { CHAIN_IDS } from '../constants/chain-configs/chain'
import {
  NATIVE_CURRENCY,
  REFERENCE_CURRENCY,
  STABLE_COINS,
} from '../constants/chain-configs/currency'
import { Currency } from '../entities/currency/types'
import {
  fetchCurrencies,
  fetchCurrentPriceMap,
  fetchDailyPriceMapAtTimestamp,
} from '../entities/currency/apis/price'

/**
 * Get native currency for a given chain id
 * @param chainId - chain id from {@link CHAIN_IDS}
 * @returns Native currency
 *
 * @example
 * import { getNativeCurrency } from '@clober/v2-sdk'
 *
 * const currency = getNativeCurrency({
 *   chainId: 421614,
 * })
 */
export const getNativeCurrency = ({
  chainId,
}: {
  chainId: CHAIN_IDS
}): Currency => {
  return NATIVE_CURRENCY[chainId]
}

/**
 * Get Reference currency for a given chain id
 * @param chainId - chain id from {@link CHAIN_IDS}
 * @returns Reference currency
 *
 * @example
 * import { getReferenceCurrency } from '@clober/v2-sdk'
 *
 * const address = await getReferenceCurrency({
 *   chainId: 421614,
 * })
 */
export const getReferenceCurrency = ({
  chainId,
}: {
  chainId: CHAIN_IDS
}): Currency => {
  return REFERENCE_CURRENCY[chainId]
}

export const getCurrencies = ({
  chainId,
}: {
  chainId: CHAIN_IDS
}): Promise<Currency[]> => {
  return fetchCurrencies(chainId)
}

export const getStableCurrencies = ({
  chainId,
}: {
  chainId: CHAIN_IDS
}): Currency[] => {
  return STABLE_COINS[chainId]
}

export const getLatestPriceMap = async ({
  chainId,
}: {
  chainId: CHAIN_IDS
}): Promise<{ [address: `0x${string}`]: number }> => {
  return fetchCurrentPriceMap(chainId)
}

export const getDailyClosePriceMap = async ({
  chainId,
  timestampInSeconds,
}: {
  chainId: CHAIN_IDS
  timestampInSeconds: number
}): Promise<{ [address: `0x${string}`]: number }> => {
  return fetchDailyPriceMapAtTimestamp(chainId, timestampInSeconds)
}
