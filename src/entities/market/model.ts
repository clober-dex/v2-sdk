import { formatUnits, isAddressEqual } from 'viem'

import { CHAIN_IDS } from '../../constants/chain-configs/chain'
import { invertTick, toPrice, formatPrice, quoteToBase } from '../../utils'
import {
  MAKER_DEFAULT_POLICY,
  TAKER_DEFAULT_POLICY,
} from '../../constants/chain-configs/fee'
import { Market as MarketType } from '../../types'
import { BookModel } from '../book/model'
import type { Currency } from '../currency/model'

import { getMarketId } from './utils/market-id'

type Depth = {
  price: string
  tick: bigint
  baseAmount: bigint
}

export class MarketModel {
  chainId: CHAIN_IDS
  makerFee: number
  takerFee: number

  id: string
  quote: Currency
  base: Currency
  bids: Depth[]
  asks: Depth[]
  bidBook: BookModel
  askBook: BookModel

  constructor({
    chainId,
    tokens,
    bidBook,
    askBook,
  }: {
    chainId: CHAIN_IDS
    tokens: [Currency, Currency]
    bidBook: BookModel
    askBook: BookModel
  }) {
    this.chainId = chainId
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

  toJson = (): MarketType => {
    return {
      chainId: this.chainId,
      quote: this.quote,
      base: this.base,
      makerFee: this.makerFee,
      takerFee: this.takerFee,
      bids: this.bids.map(({ price, tick, baseAmount }) => ({
        price,
        tick: Number(tick),
        baseAmount: formatUnits(baseAmount, this.base.decimals),
      })),
      bidBook: {
        id: this.bidBook.id.toString(),
        base: this.bidBook.base,
        unitSize: this.bidBook.unitSize.toString(),
        quote: this.bidBook.quote,
        isOpened: this.bidBook.isOpened,
      },
      asks: this.asks.map(({ price, tick, baseAmount }) => ({
        price,
        tick: Number(tick),
        baseAmount: formatUnits(baseAmount, this.base.decimals),
      })),
      askBook: {
        id: this.askBook.id.toString(),
        base: this.askBook.base,
        unitSize: this.askBook.unitSize.toString(),
        quote: this.askBook.quote,
        isOpened: this.askBook.isOpened,
      },
    }
  }
}
