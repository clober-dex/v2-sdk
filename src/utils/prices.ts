import BigNumber from 'bignumber.js'

import { PRICE_PRECISION } from '../constants/price'

export const formatPrice = (
  price: bigint,
  quoteDecimals: number,
  baseDecimals: number,
): number => {
  return new BigNumber(price.toString())
    .div(new BigNumber(2).pow(PRICE_PRECISION.toString()))
    .times(new BigNumber(10).pow(baseDecimals))
    .div(new BigNumber(10).pow(quoteDecimals))
    .toNumber()
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
