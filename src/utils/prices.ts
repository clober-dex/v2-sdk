import BigNumber from 'bignumber.js'

import { PRICE_PRECISION } from '../constants/price'
import { Currency } from '../model/currency'

import { fromPrice, invertPrice, toPrice } from './tick'

BigNumber.config({
  DECIMAL_PLACES: 100,
})

// @dev: Use this function only for display purposes not logic
export const formatPrice = (
  price: bigint,
  quoteDecimals: number,
  baseDecimals: number,
): string => {
  return new BigNumber(price.toString())
    .div(new BigNumber(2).pow(PRICE_PRECISION.toString()))
    .times(new BigNumber(10).pow(baseDecimals))
    .div(new BigNumber(10).pow(quoteDecimals))
    .toString()
}

export const parsePrice = (
  price: number,
  quoteDecimals: number,
  baseDecimals: number,
): bigint => {
  const value = new BigNumber(price)
    .times(new BigNumber(2).pow(PRICE_PRECISION.toString()))
    .times(new BigNumber(10).pow(quoteDecimals))
    .div(new BigNumber(10).pow(baseDecimals))
  const rawPrice = BigInt(
    value.isInteger() ? value.toFixed() : value.integerValue().toFixed(),
  )
  const tick = fromPrice(rawPrice)
  const flooredPrice = toPrice(tick)
  if (rawPrice === flooredPrice) {
    return toPrice(tick)
  }
  return toPrice(tick + 1n)
}

export const getMarketPrice = ({
  marketQuoteCurrency,
  marketBaseCurrency,
  bidTick,
  askTick,
}: {
  marketQuoteCurrency: Currency
  marketBaseCurrency: Currency
  bidTick?: bigint
  askTick?: bigint
}): string => {
  if (bidTick) {
    return formatPrice(
      toPrice(bidTick),
      marketQuoteCurrency.decimals,
      marketBaseCurrency.decimals,
    )
  } else if (askTick) {
    return formatPrice(
      invertPrice(toPrice(askTick)),
      marketQuoteCurrency.decimals,
      marketBaseCurrency.decimals,
    )
  } else {
    throw new Error('Either bidTick or askTick must be provided')
  }
}
