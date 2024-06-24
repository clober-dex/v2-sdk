import BigNumber from 'bignumber.js'

import { PRICE_PRECISION } from '../constants/price'
import { Currency } from '../model/currency'

import { invertPrice, toPrice } from './tick'

BigNumber.config({
  DECIMAL_PLACES: 100,
})

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
  return BigInt(
    value.isInteger() ? value.toFixed() : value.integerValue().toFixed(),
  )
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
