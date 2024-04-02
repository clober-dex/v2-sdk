import { divide } from './math'
import { toPrice } from './tick'

export const baseToQuote = (
  tick: bigint,
  base: bigint,
  roundingUp: boolean,
): bigint => {
  return divide(base * toPrice(tick), 1n << 128n, roundingUp)
}

export const quoteToBase = (
  tick: bigint,
  quote: bigint,
  roundingUp: boolean,
): bigint => {
  return divide(quote << 128n, toPrice(tick), roundingUp)
}
