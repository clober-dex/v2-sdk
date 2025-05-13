import { TAKER_DEFAULT_POLICY } from '../constants/fee'
import { divide } from '../utils/math'
import { baseToQuote, quoteToBase } from '../utils/decimals'
import { CHAIN_IDS } from '../constants/chain'
import { MIN_TICK } from '../constants/tick'

import type { Currency } from './currency'
import type { RawDepth } from './depth'

export type TakeSampleDto = {
  timestamp: string
  inputToken: {
    id: string
    name: string
    symbol: string
    decimals: string
  }
  outputToken: {
    id: string
    name: string
    symbol: string
    decimals: string
  }
  inputAmount: string
  outputAmount: string
}

export type BookDayDataDTO = {
  volumeUSD: string
  book: {
    id: string
    volumeUSD: string
    price: string
    inversePrice: string
    latestTaken: TakeSampleDto[]
    firstTaken: TakeSampleDto[]
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
    createdAtTimestamp: string
  }
}

export class Book {
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
