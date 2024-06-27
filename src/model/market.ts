import { isAddressEqual } from 'viem'

import { getMarketId } from '../utils/market'
import { CHAIN_IDS } from '../constants/chain'
import { invertTick, toPrice } from '../utils/tick'
import { formatPrice } from '../utils/prices'
import { MAKER_DEFAULT_POLICY, TAKER_DEFAULT_POLICY } from '../constants/fee'
import { quoteToBase } from '../utils/decimals'

import { Book } from './book'
import type { Currency } from './currency'
import type { Depth } from './depth'

export class Market {
  makerFee: number
  takerFee: number

  id: string
  quote: Currency
  base: Currency
  bids: Depth[]
  asks: Depth[]
  bidBook: Book
  askBook: Book

  constructor({
    chainId,
    tokens,
    bidBook,
    askBook,
  }: {
    chainId: CHAIN_IDS
    tokens: [Currency, Currency]
    bidBook: Book
    askBook: Book
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

    this.makerFee = (Number(MAKER_DEFAULT_POLICY[chainId].rate) * 100) / 1e6
    this.takerFee = (Number(TAKER_DEFAULT_POLICY[chainId].rate) * 100) / 1e6

    this.bids = bidBook.depths.map(
      (depth) =>
        ({
          price: formatPrice(
            toPrice(depth.tick),
            this.quote.decimals,
            this.base.decimals,
          ),
          tick: depth.tick,
          baseAmount: quoteToBase(
            depth.tick,
            depth.unitAmount * bidBook.unitSize,
            false,
          ),
        }) as Depth,
    )

    this.asks = askBook.depths.map((depth) => {
      const price = toPrice(invertTick(depth.tick))
      const readablePrice = formatPrice(
        price,
        this.quote.decimals,
        this.base.decimals,
      )
      const baseAmount = depth.unitAmount * askBook.unitSize
      return {
        price: readablePrice,
        tick: depth.tick,
        baseAmount,
      } as Depth
    })

    this.bidBook = bidBook
    this.askBook = askBook
  }

  take = ({
    takeQuote,
    limitTick,
    amountOut, // quote if takeQuote, base otherwise
  }: {
    takeQuote: boolean
    limitTick: bigint
    amountOut: bigint
  }) => {
    if (takeQuote) {
      return {
        bookId: this.bidBook.id,
        ...this.bidBook.take({
          limitTick,
          amountOut,
        }),
      }
    } else {
      return {
        bookId: this.askBook.id,
        ...this.askBook.take({
          limitTick: invertTick(limitTick),
          amountOut,
        }),
      }
    }
  }

  spend = ({
    spentBase,
    limitTick,
    amountIn, // base if spentBase, quote otherwise
  }: {
    spentBase: boolean
    limitTick: bigint
    amountIn: bigint
  }) => {
    if (spentBase) {
      return {
        bookId: this.bidBook.id,
        ...this.bidBook.spend({
          limitTick,
          amountIn,
        }),
      }
    } else {
      return {
        bookId: this.askBook.id,
        ...this.askBook.spend({
          limitTick: invertTick(limitTick),
          amountIn,
        }),
      }
    }
  }
}
