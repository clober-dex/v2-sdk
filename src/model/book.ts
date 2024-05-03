import { toPrice } from '../utils/tick'
import { TAKER_DEFAULT_POLICY } from '../constants/fee'
import { divide } from '../utils/math'
import { baseToQuote, quoteToBase } from '../utils/decimals'

import type { Currency } from './currency'
import type { DepthDto } from './depth'

export class Book {
  id: bigint
  base: Currency
  unitSize: bigint
  quote: Currency
  depths: DepthDto[]
  isOpened: boolean

  constructor({
    id,
    base,
    quote,
    unitSize,
    depths,
    isOpened,
  }: {
    id: bigint
    base: Currency
    quote: Currency
    unitSize: bigint
    depths: DepthDto[]
    isOpened: boolean
  }) {
    this.id = id
    this.base = base
    this.unitSize = unitSize
    this.quote = quote
    this.depths = depths
    this.isOpened = isOpened
  }

  take = ({
    limitPrice,
    amountOut, // quote
  }: {
    limitPrice: bigint
    amountOut: bigint
  }) => {
    let takenQuoteAmount = 0n
    let spentBaseAmount = 0n
    if (this.depths.length === 0) {
      return {
        takenQuoteAmount,
        spentBaseAmount,
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
      maxAmount = divide(maxAmount, this.unitSize, true)

      if (maxAmount === 0n) {
        break
      }
      const currentDepth = this.depths.find((depth) => depth.tick === tick)!
      let quoteAmount =
        (currentDepth.unitAmount > maxAmount
          ? maxAmount
          : currentDepth.unitAmount) * this.unitSize
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
      spentBaseAmount += baseAmount
      if (amountOut <= takenQuoteAmount) {
        break
      }
      index++
      tick = ticks[index]!
    }
    return {
      takenQuoteAmount,
      spentBaseAmount,
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
    let spentBaseAmount = 0n
    if (this.depths.length === 0) {
      return {
        takenQuoteAmount,
        spentBaseAmount,
      }
    }

    const ticks = this.depths
      .sort((a, b) => Number(b.tick) - Number(a.tick))
      .map((depth) => depth.tick)
    let index = 0
    let tick = ticks[index]!
    while (spentBaseAmount <= amountIn && tick > -8388608n) {
      if (limitPrice > toPrice(tick)) {
        break
      }
      let maxAmount = TAKER_DEFAULT_POLICY.usesQuote
        ? amountIn - spentBaseAmount
        : TAKER_DEFAULT_POLICY.calculateOriginalAmount(
            amountIn - spentBaseAmount,
            false,
          )
      maxAmount = baseToQuote(tick, maxAmount, false) / this.unitSize

      if (maxAmount === 0n) {
        break
      }
      const currentDepth = this.depths.find((depth) => depth.tick === tick)!
      let quoteAmount =
        (currentDepth.unitAmount > maxAmount
          ? maxAmount
          : currentDepth.unitAmount) * this.unitSize
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
      spentBaseAmount += baseAmount
      index++
      tick = ticks[index]!
    }
    return {
      takenQuoteAmount,
      spentBaseAmount,
    }
  }
}
