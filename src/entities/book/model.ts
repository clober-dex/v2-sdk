import { TAKER_DEFAULT_POLICY } from '../../constants/chain-configs/fee'
import { divide } from '../../utils/math'
import { baseToQuote, quoteToBase } from '../../utils'
import { CHAIN_IDS } from '../../constants/chain-configs/chain'
import { MIN_TICK } from '../../constants/tick'
import type { Currency } from '../currency/model'

type RawDepth = {
  tick: bigint
  unitAmount: bigint
}

export class BookModel {
  chainId: CHAIN_IDS
  id: bigint
  base: Currency
  unitSize: bigint
  quote: Currency
  depths: RawDepth[]
  isOpened: boolean

  constructor({
    chainId,
    id,
    base,
    quote,
    unitSize,
    depths,
    isOpened,
  }: {
    chainId: CHAIN_IDS
    id: bigint
    base: Currency
    quote: Currency
    unitSize: bigint
    depths: RawDepth[]
    isOpened: boolean
  }) {
    this.chainId = chainId
    this.id = id
    this.base = base
    this.unitSize = unitSize
    this.quote = quote
    this.depths = depths
    this.isOpened = isOpened
  }

  take = ({
    limitTick,
    amountOut, // quote
  }: {
    limitTick: bigint
    amountOut: bigint
  }) => {
    const events: {
      tick: bigint
      takenQuoteAmount: bigint
      spentBaseAmount: bigint
    }[] = []
    let takenQuoteAmount = 0n
    let spentBaseAmount = 0n
    if (this.depths.length === 0) {
      return {
        takenQuoteAmount,
        spentBaseAmount,
        events,
      }
    }

    const ticks = this.depths
      .sort((a, b) => Number(b.tick) - Number(a.tick))
      .map((depth) => depth.tick)
    let index = 0
    let tick = ticks[index]!
    while (tick >= MIN_TICK) {
      if (limitTick > tick) {
        break
      }
      let maxAmount = TAKER_DEFAULT_POLICY[this.chainId].usesQuote
        ? TAKER_DEFAULT_POLICY[this.chainId].calculateOriginalAmount(
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
      if (TAKER_DEFAULT_POLICY[this.chainId].usesQuote) {
        quoteAmount =
          quoteAmount -
          TAKER_DEFAULT_POLICY[this.chainId].calculateFee(quoteAmount, false)
      } else {
        baseAmount =
          baseAmount +
          TAKER_DEFAULT_POLICY[this.chainId].calculateFee(baseAmount, false)
      }
      if (quoteAmount === 0n) {
        break
      }
      events.push({
        tick,
        takenQuoteAmount: quoteAmount,
        spentBaseAmount: baseAmount,
      })
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
      events,
    }
  }

  spend = ({
    limitTick,
    amountIn, // base
  }: {
    limitTick: bigint
    amountIn: bigint
  }) => {
    const events: {
      tick: bigint
      takenQuoteAmount: bigint
      spentBaseAmount: bigint
    }[] = []
    let takenQuoteAmount = 0n
    let spentBaseAmount = 0n
    if (this.depths.length === 0) {
      return {
        takenQuoteAmount,
        spentBaseAmount,
        events,
      }
    }

    const ticks = this.depths
      .sort((a, b) => Number(b.tick) - Number(a.tick))
      .map((depth) => depth.tick)
    let index = 0
    let tick = ticks[index]!
    while (spentBaseAmount <= amountIn && tick >= MIN_TICK) {
      if (limitTick > tick) {
        break
      }
      let maxAmount = TAKER_DEFAULT_POLICY[this.chainId].usesQuote
        ? amountIn - spentBaseAmount
        : TAKER_DEFAULT_POLICY[this.chainId].calculateOriginalAmount(
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
      if (TAKER_DEFAULT_POLICY[this.chainId].usesQuote) {
        quoteAmount =
          quoteAmount -
          TAKER_DEFAULT_POLICY[this.chainId].calculateFee(quoteAmount, false)
      } else {
        baseAmount =
          baseAmount +
          TAKER_DEFAULT_POLICY[this.chainId].calculateFee(baseAmount, false)
      }
      if (baseAmount === 0n) {
        break
      }
      events.push({
        tick,
        takenQuoteAmount: quoteAmount,
        spentBaseAmount: baseAmount,
      })
      takenQuoteAmount += quoteAmount
      spentBaseAmount += baseAmount
      index++
      tick = ticks[index]!
    }
    return {
      takenQuoteAmount,
      spentBaseAmount,
      events,
    }
  }
}
