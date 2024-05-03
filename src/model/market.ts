import { isAddressEqual } from 'viem'

import { getMarketId } from '../utils/market'
import { CHAIN_IDS } from '../constants/chain'
import { invertPrice, toPrice } from '../utils/tick'
import { formatPrice } from '../utils/prices'
import { MAKER_DEFAULT_POLICY, TAKER_DEFAULT_POLICY } from '../constants/fee'
import { quoteToBase } from '../utils/decimals'

import { Book } from './book'
import type { Currency } from './currency'
import type { Depth } from './depth'

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
  private bidBook: Book
  private askBook: Book

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

    this.bids = bidBook.depths.map(
      (depth) =>
        ({
          price: formatPrice(
            toPrice(depth.tick),
            this.quote.decimals,
            this.base.decimals,
          ),
          baseAmount: quoteToBase(
            depth.tick,
            depth.unitAmount * bidBook.unitSize,
            false,
          ),
        }) as Depth,
    )
    this.bidBookOpen = bidBook.isOpened

    this.asks = askBook.depths.map((depth) => {
      const price = invertPrice(toPrice(depth.tick))
      const readablePrice = formatPrice(
        price,
        this.quote.decimals,
        this.base.decimals,
      )
      const baseAmount = depth.unitAmount * askBook.unitSize
      return {
        price: readablePrice,
        baseAmount,
      } as Depth
    })
    this.askBookOpen = askBook.isOpened

    this.bidBook = bidBook
    this.askBook = askBook
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
      return {
        bookId: this.bidBook.id,
        ...this.bidBook.take({
          limitPrice,
          amountOut,
        }),
      }
    } else {
      return {
        bookId: this.askBook.id,
        ...this.askBook.take({
          limitPrice: invertPrice(limitPrice),
          amountOut,
        }),
      }
    }
  }

  spend = ({
    spentBase,
    limitPrice,
    amountIn, // base if spentBase, quote otherwise
  }: {
    spentBase: boolean
    limitPrice: bigint
    amountIn: bigint
  }) => {
    if (spentBase) {
      return {
        bookId: this.bidBook.id,
        ...this.bidBook.spend({
          limitPrice,
          amountIn,
        }),
      }
    } else {
      return {
        bookId: this.askBook.id,
        ...this.askBook.spend({
          limitPrice: invertPrice(limitPrice),
          amountIn,
        }),
      }
    }
  }
}
