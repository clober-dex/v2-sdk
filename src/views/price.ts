import { isAddressEqual } from 'viem'

import { CHAIN_IDS } from '../constants/chain-configs/chain'
import { Currency } from '../entities/currency/model'
import { formatPrice, invertTick, parsePrice, toPrice } from '../utils'

import { getQuoteToken } from './index'

/**
 * Calculates and returns the neighboring price ticks and their corresponding prices for a given input price.
 *
 * @param {CHAIN_IDS} chainId - chain id from {@link CHAIN_IDS}
 * @param {string} price - The input price to calculate the neighborhood for, as a string.
 * @param {Currency} currency0 - token0 currency {@link Currency}.
 * @param {Currency} currency1 - token1 currency {@link Currency}.
 *
 * @returns {Object} An object containing the normal and inverted price neighborhoods. Each neighborhood includes:
 *   - up: The tick and price for one tick above the current price.
 *   - now: The tick and price for the current price.
 *   - down: The tick and price for one tick below the current price.
 */
export const getPriceNeighborhood = ({
  chainId,
  price,
  currency0,
  currency1,
}: {
  chainId: CHAIN_IDS
  price: string
  currency0: Currency
  currency1: Currency
}) => {
  const quoteTokenAddress = getQuoteToken({
    chainId,
    token0: currency0.address,
    token1: currency1.address,
  })
  const quoteCurrency = isAddressEqual(quoteTokenAddress, currency0.address)
    ? currency0
    : currency1
  const baseCurrency = isAddressEqual(quoteTokenAddress, currency0.address)
    ? currency1
    : currency0
  const { roundingDownTick, roundingUpTick } = parsePrice(
    Number(price),
    quoteCurrency.decimals,
    baseCurrency.decimals,
  )
  const bidBookTick = roundingDownTick
  const askBookTick = invertTick(roundingUpTick)
  return {
    normal: {
      nextUp: {
        tick: bidBookTick + 2n,
        price: formatPrice(
          toPrice(bidBookTick + 2n),
          quoteCurrency.decimals,
          baseCurrency.decimals,
        ),
        marketPrice: formatPrice(
          toPrice(bidBookTick + 2n),
          quoteCurrency.decimals,
          baseCurrency.decimals,
        ),
      },
      up: {
        tick: bidBookTick + 1n,
        price: formatPrice(
          toPrice(bidBookTick + 1n),
          quoteCurrency.decimals,
          baseCurrency.decimals,
        ),
        marketPrice: formatPrice(
          toPrice(bidBookTick + 1n),
          quoteCurrency.decimals,
          baseCurrency.decimals,
        ),
      },
      now: {
        tick: bidBookTick,
        price: formatPrice(
          toPrice(bidBookTick),
          quoteCurrency.decimals,
          baseCurrency.decimals,
        ),
        marketPrice: formatPrice(
          toPrice(bidBookTick),
          quoteCurrency.decimals,
          baseCurrency.decimals,
        ),
      },
      down: {
        tick: bidBookTick - 1n,
        price: formatPrice(
          toPrice(bidBookTick - 1n),
          quoteCurrency.decimals,
          baseCurrency.decimals,
        ),
        marketPrice: formatPrice(
          toPrice(bidBookTick - 1n),
          quoteCurrency.decimals,
          baseCurrency.decimals,
        ),
      },
      nextDown: {
        tick: bidBookTick - 2n,
        price: formatPrice(
          toPrice(bidBookTick - 2n),
          quoteCurrency.decimals,
          baseCurrency.decimals,
        ),
        marketPrice: formatPrice(
          toPrice(bidBookTick - 2n),
          quoteCurrency.decimals,
          baseCurrency.decimals,
        ),
      },
    },
    inverted: {
      nextUp: {
        tick: askBookTick + 2n,
        price: formatPrice(
          toPrice(askBookTick + 2n),
          baseCurrency.decimals,
          quoteCurrency.decimals,
        ),
        marketPrice: formatPrice(
          toPrice(invertTick(askBookTick + 2n)),
          quoteCurrency.decimals,
          baseCurrency.decimals,
        ),
      },
      up: {
        tick: askBookTick + 1n,
        price: formatPrice(
          toPrice(askBookTick + 1n),
          baseCurrency.decimals,
          quoteCurrency.decimals,
        ),
        marketPrice: formatPrice(
          toPrice(invertTick(askBookTick + 1n)),
          quoteCurrency.decimals,
          baseCurrency.decimals,
        ),
      },
      now: {
        tick: askBookTick,
        price: formatPrice(
          toPrice(askBookTick),
          baseCurrency.decimals,
          quoteCurrency.decimals,
        ),
        marketPrice: formatPrice(
          toPrice(invertTick(askBookTick)),
          quoteCurrency.decimals,
          baseCurrency.decimals,
        ),
      },
      down: {
        tick: askBookTick - 1n,
        price: formatPrice(
          toPrice(askBookTick - 1n),
          baseCurrency.decimals,
          quoteCurrency.decimals,
        ),
        marketPrice: formatPrice(
          toPrice(invertTick(askBookTick - 1n)),
          quoteCurrency.decimals,
          baseCurrency.decimals,
        ),
      },
      nextDown: {
        tick: askBookTick - 2n,
        price: formatPrice(
          toPrice(askBookTick - 2n),
          baseCurrency.decimals,
          quoteCurrency.decimals,
        ),
        marketPrice: formatPrice(
          toPrice(invertTick(askBookTick - 2n)),
          quoteCurrency.decimals,
          baseCurrency.decimals,
        ),
      },
    },
  }
}
