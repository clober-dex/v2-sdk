import { toPrice } from '../utils/tick'
import { TAKER_DEFAULT_POLICY } from '../constants/fee'
import { divide } from '../utils/math'
import { baseToQuote, quoteToBase } from '../utils/decimals'

import type { Currency } from './currency'
import type { RawDepth } from './depth'

export type BookDto = {
  id: string
  base: {
    id: string
    name: string
    symbol: string
    decimals: string
  }
  quote: {
    id: string
    name: string
    symbol: string
    decimals: string
  }
  unit: string
  depths: {
    tick: string
    price: string
    rawAmount: string
  }[]
}

export class Book {
  id: bigint
  base: Currency
  unit: bigint
  quote: Currency
  depths: RawDepth[]

  constructor({
    id,
    base,
    quote,
    unit,
    depths,
  }: {
    id: bigint
    base: Currency
    quote: Currency
    unit: bigint
    depths: RawDepth[]
  }) {
    this.id = id
    this.base = base
    this.unit = unit
    this.quote = quote
    this.depths = depths
  }

  take = ({
    limitPrice,
    amountOut, // quote
  }: {
    limitPrice: bigint
    amountOut: bigint
  }) => {
    let takenQuoteAmount = 0n
    let spendBaseAmount = 0n
    if (this.depths.length === 0) {
      return {
        takenQuoteAmount,
        spendBaseAmount,
      }
    }

    const ticks = this.depths
      .sort((a, b) => Number(b.tick) - Number(a.tick))
      .map((depth) => depth.tick)
    let index = 0
    let tick = ticks[index]!
    while (tick > -8388608n) {
      if (limitPrice > toPrice(tick)) {
        break
      }
      let maxAmount = TAKER_DEFAULT_POLICY.usesQuote
        ? TAKER_DEFAULT_POLICY.calculateOriginalAmount(
            amountOut - takenQuoteAmount,
            true,
          )
        : amountOut - takenQuoteAmount
      maxAmount = divide(maxAmount, this.unit, true)

      if (maxAmount === 0n) {
        break
      }
      const currentDepth = this.depths.find((depth) => depth.tick === tick)!
      let quoteAmount =
        (currentDepth.rawAmount > maxAmount
          ? maxAmount
          : currentDepth.rawAmount) * this.unit
      let baseAmount = quoteToBase(tick, quoteAmount, true)
      if (TAKER_DEFAULT_POLICY.usesQuote) {
        quoteAmount =
          quoteAmount - TAKER_DEFAULT_POLICY.calculateFee(quoteAmount, false)
      } else {
        baseAmount =
          baseAmount + TAKER_DEFAULT_POLICY.calculateFee(baseAmount, false)
      }
      if (quoteAmount === 0n) {
        break
      }

      takenQuoteAmount += quoteAmount
      spendBaseAmount += baseAmount
      if (amountOut <= takenQuoteAmount) {
        break
      }
      index++
      tick = ticks[index]!
    }
    return {
      takenQuoteAmount,
      spendBaseAmount,
    }
  }

  spend = ({
    limitPrice,
    amountIn, // base
  }: {
    limitPrice: bigint
    amountIn: bigint
  }) => {
    let takenQuoteAmount = 0n
    let spendBaseAmount = 0n
    if (this.depths.length === 0) {
      return {
        takenQuoteAmount,
        spendBaseAmount,
      }
    }

    const ticks = this.depths
      .sort((a, b) => Number(b.tick) - Number(a.tick))
      .map((depth) => depth.tick)
    let index = 0
    let tick = ticks[index]!
    while (spendBaseAmount <= amountIn && tick > -8388608n) {
      if (limitPrice > toPrice(tick)) {
        break
      }
      let maxAmount = TAKER_DEFAULT_POLICY.usesQuote
        ? amountIn - spendBaseAmount
        : TAKER_DEFAULT_POLICY.calculateOriginalAmount(
            amountIn - spendBaseAmount,
            false,
          )
      maxAmount = baseToQuote(tick, maxAmount, false) / this.unit

      if (maxAmount === 0n) {
        break
      }
      const currentDepth = this.depths.find((depth) => depth.tick === tick)!
      let quoteAmount =
        (currentDepth.rawAmount > maxAmount
          ? maxAmount
          : currentDepth.rawAmount) * this.unit
      let baseAmount = quoteToBase(tick, quoteAmount, true)
      if (TAKER_DEFAULT_POLICY.usesQuote) {
        quoteAmount =
          quoteAmount - TAKER_DEFAULT_POLICY.calculateFee(quoteAmount, false)
      } else {
        baseAmount =
          baseAmount + TAKER_DEFAULT_POLICY.calculateFee(baseAmount, false)
      }
      if (baseAmount === 0n) {
        break
      }

      takenQuoteAmount += quoteAmount
      spendBaseAmount += baseAmount
      index++
      tick = ticks[index]!
    }
    return {
      takenQuoteAmount,
      spendBaseAmount,
    }
  }
}
