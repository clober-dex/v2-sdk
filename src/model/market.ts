import { isAddressEqual } from 'viem'

import { getMarketId } from '../utils/market'
import { CHAIN_IDS } from '../constants/chain'
import { invertPrice, toPrice } from '../utils/tick'
import { formatPrice } from '../utils/prices'
import { MAKER_DEFAULT_POLICY, TAKER_DEFAULT_POLICY } from '../constants/fee'
import { divide } from '../utils/math'
import { baseToQuote, quoteToBase } from '../utils/decimals'

import { Book } from './book'
import type { Currency } from './currency'
import type { Depth, RawDepth } from './depth'

export class Market {
  readonly makerFee = (Number(MAKER_DEFAULT_POLICY.rate) * 100) / 1e6
  readonly takerFee = (Number(TAKER_DEFAULT_POLICY.rate) * 100) / 1e6

  id: string
  quote: Currency
  base: Currency
  bids: Depth[]
  bidBookOpen: boolean
  asks: Depth[]
  askBookOpen: boolean
  private books: Book[]

  constructor({
    chainId,
    tokens,
    books,
  }: {
    chainId: CHAIN_IDS
    tokens: [Currency, Currency]
    books: Book[]
  }) {
    const { marketId, quoteTokenAddress, baseTokenAddress } = getMarketId(
      chainId,
      tokens.map((token) => token.address),
    )
    this.id = marketId
    this.quote = tokens.find((token) =>
      isAddressEqual(token.address, quoteTokenAddress!),
    )!
    this.base = tokens.find((token) =>
      isAddressEqual(token.address, baseTokenAddress!),
    )!

    this.bids = books
      .filter((book) => isAddressEqual(book.quote.address, this.quote.address))
      .flatMap((book) => book.depths)
      .map(
        (depth) =>
          ({
            price: formatPrice(
              toPrice(depth.tick),
              this.quote.decimals,
              this.base.decimals,
            ),
            baseAmount: quoteToBase(
              depth.tick,
              depth.rawAmount * depth.unit,
              false,
            ),
          }) as Depth,
      )
    this.bidBookOpen =
      books.filter((book) =>
        isAddressEqual(book.quote.address, this.quote.address),
      ).length > 0
    this.asks = books
      .filter((book) => isAddressEqual(book.quote.address, this.base.address))
      .flatMap((book) => book.depths)
      .map((depth) => {
        const price = invertPrice(toPrice(depth.tick))
        const readablePrice = formatPrice(
          price,
          this.quote.decimals,
          this.base.decimals,
        )
        const baseAmount = depth.rawAmount * depth.unit
        return {
          price: readablePrice,
          baseAmount,
        } as Depth
      })
    this.askBookOpen =
      books.filter((book) =>
        isAddressEqual(book.quote.address, this.base.address),
      ).length > 0
    this.books = books
  }

  take = ({
    takeQuote,
    limitPrice,
    amountOut, // quote if takeQuote, base otherwise
  }: {
    takeQuote: boolean
    limitPrice: bigint
    amountOut: bigint
  }) => {
    if (takeQuote) {
      const bidDepths = this.books
        .filter((book) =>
          isAddressEqual(book.quote.address, this.quote.address),
        )
        .flatMap((book) => book.depths)
      return this.takeInner({ depths: bidDepths, limitPrice, amountOut })
    } else {
      const askDepths = this.books
        .filter((book) => isAddressEqual(book.quote.address, this.base.address))
        .flatMap((book) => book.depths)
      return this.takeInner({
        depths: askDepths,
        limitPrice: invertPrice(limitPrice),
        amountOut,
      })
    }
  }

  spend = ({
    spendBase,
    limitPrice,
    amountIn, // base if spendBase, quote otherwise
  }: {
    spendBase: boolean
    limitPrice: bigint
    amountIn: bigint
  }) => {
    if (spendBase) {
      const bidDepths = this.books
        .filter((book) =>
          isAddressEqual(book.quote.address, this.quote.address),
        )
        .flatMap((book) => book.depths)
      return this.spendInner({ depths: bidDepths, limitPrice, amountIn })
    } else {
      const askDepths = this.books
        .filter((book) => isAddressEqual(book.quote.address, this.base.address))
        .flatMap((book) => book.depths)
      return this.spendInner({
        depths: askDepths,
        limitPrice: invertPrice(limitPrice),
        amountIn,
      })
    }
  }

  private takeInner = ({
    depths, // only bid orders
    limitPrice,
    amountOut, // quote
  }: {
    depths: RawDepth[]
    limitPrice: bigint
    amountOut: bigint
  }) => {
    if (depths.length === 0) {
      return {}
    }
    const takeResult: {
      [key in string]: {
        takenAmount: bigint
        spendAmount: bigint
      }
    } = {}
    for (const depth of depths) {
      if (!takeResult[depth.bookId]) {
        takeResult[depth.bookId] = {
          takenAmount: 0n,
          spendAmount: 0n,
        }
      }
    }
    let totalTakenQuoteAmount = 0n

    const ticks = depths
      .sort((a, b) => Number(b.tick) - Number(a.tick))
      .map((depth) => depth.tick)
    let index = 0
    let tick = ticks[index]!
    while (tick > -8388608n) {
      if (limitPrice > toPrice(tick)) {
        break
      }
      const currentDepth = depths.find((depth) => depth.tick === tick)!
      const currentBook = this.books.find(
        (book) => book.id === BigInt(currentDepth.bookId),
      )!
      let maxAmount = TAKER_DEFAULT_POLICY.usesQuote
        ? TAKER_DEFAULT_POLICY.calculateOriginalAmount(
            amountOut - totalTakenQuoteAmount,
            true,
          )
        : amountOut - totalTakenQuoteAmount
      maxAmount = divide(maxAmount, currentBook.unit, true)

      if (maxAmount === 0n) {
        break
      }
      let quoteAmount =
        (currentDepth.rawAmount > maxAmount
          ? maxAmount
          : currentDepth.rawAmount) * currentBook.unit
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

      takeResult[currentDepth.bookId]!.takenAmount += quoteAmount
      takeResult[currentDepth.bookId]!.spendAmount += baseAmount
      totalTakenQuoteAmount += quoteAmount
      if (amountOut <= totalTakenQuoteAmount) {
        break
      }
      if (ticks.length === index + 1) {
        break
      }
      index++
      tick = ticks[index]!
    }
    return Object.fromEntries(
      Object.entries(takeResult).filter(
        ([, value]) => value.spendAmount > 0 && value.takenAmount > 0,
      ),
    )
  }

  private spendInner = ({
    depths, // only bid orders
    limitPrice,
    amountIn, // base
  }: {
    depths: RawDepth[]
    limitPrice: bigint
    amountIn: bigint
  }) => {
    if (depths.length === 0) {
      return {}
    }
    const spendResult: {
      [key in string]: {
        takenAmount: bigint
        spendAmount: bigint
      }
    } = {}
    for (const depth of depths) {
      if (!spendResult[depth.bookId]) {
        spendResult[depth.bookId] = {
          takenAmount: 0n,
          spendAmount: 0n,
        }
      }
    }
    let totalSpendBaseAmount = 0n

    const ticks = depths
      .sort((a, b) => Number(b.tick) - Number(a.tick))
      .map((depth) => depth.tick)
    let index = 0
    let tick = ticks[index]!
    while (totalSpendBaseAmount <= amountIn && tick > -8388608n) {
      if (limitPrice > toPrice(tick)) {
        break
      }
      const currentDepth = depths.find((depth) => depth.tick === tick)!
      const currentBook = this.books.find(
        (book) => book.id === BigInt(currentDepth.bookId),
      )!
      let maxAmount = TAKER_DEFAULT_POLICY.usesQuote
        ? amountIn - totalSpendBaseAmount
        : TAKER_DEFAULT_POLICY.calculateOriginalAmount(
            amountIn - totalSpendBaseAmount,
            false,
          )
      maxAmount = baseToQuote(tick, maxAmount, false) / currentBook.unit

      if (maxAmount === 0n) {
        break
      }
      let quoteAmount =
        (currentDepth.rawAmount > maxAmount
          ? maxAmount
          : currentDepth.rawAmount) * currentBook.unit
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

      spendResult[currentDepth.bookId]!.takenAmount += quoteAmount
      spendResult[currentDepth.bookId]!.spendAmount += baseAmount
      totalSpendBaseAmount += baseAmount
      if (ticks.length === index + 1) {
        break
      }
      index++
      tick = ticks[index]!
    }
    return Object.fromEntries(
      Object.entries(spendResult).filter(
        ([, value]) => value.spendAmount > 0 && value.takenAmount > 0,
      ),
    )
  }
}
