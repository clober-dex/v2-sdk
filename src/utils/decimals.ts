import { PRICE_PRECISION } from '../constants/price'

import { divide } from './math'
import { toPrice } from './tick'

export const baseToQuote = (
  tick: bigint,
  base: bigint,
  roundingUp: boolean,
): bigint => {
  const y = 1n << PRICE_PRECISION
  return divide(base * toPrice(tick), y, roundingUp)
}

export const quoteToBase = (
  tick: bigint,
  quote: bigint,
  roundingUp: boolean,
): bigint => {
  const x = quote << PRICE_PRECISION
  return divide(x, toPrice(tick), roundingUp)
}
