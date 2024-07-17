import { formatUnits } from 'viem'

import { CHAIN_IDS, Currency, OpenOrder } from '../type'
import { CONTRACT_ADDRESSES } from '../constants/addresses'
import { toPoolKey } from '../utils/pool-key'

import { Market } from './market'

export class Pool {
  key: `0x${string}`
  market: Market
  isOpened: boolean
  strategy: `0x${string}`
  currencyA: Currency
  currencyB: Currency

  reserveA: string
  reserveB: string
  orderListA: OpenOrder[]
  orderListB: OpenOrder[]

  constructor({
    chainId,
    market,
    isOpened,
    bookIdA,
    bookIdB,
    reserveA,
    reserveB,
    orderListA,
    orderListB,
  }: {
    chainId: CHAIN_IDS
    market: Market
    isOpened: boolean
    bookIdA: bigint
    bookIdB: bigint
    reserveA: bigint
    reserveB: bigint
    orderListA: OpenOrder[]
    orderListB: OpenOrder[]
  }) {
    this.key = toPoolKey(bookIdA, bookIdB)
    this.market = market
    this.isOpened = isOpened
    this.strategy = CONTRACT_ADDRESSES[chainId]!.Strategy
    if (bookIdA === market.bidBook.id && bookIdB === market.askBook.id) {
      this.currencyA = market.bidBook.quote // or market.askBook.base
      this.currencyB = market.bidBook.base // or market.askBook.quote
    } else if (bookIdA === market.askBook.id && bookIdB === market.bidBook.id) {
      this.currencyA = market.askBook.quote // or market.bidBook.base
      this.currencyB = market.askBook.base // or market.bidBook.quote
    } else {
      throw new Error('Invalid book id')
    }
    this.reserveA = formatUnits(reserveA, this.currencyA.decimals)
    this.reserveB = formatUnits(reserveB, this.currencyB.decimals)
    this.orderListA = orderListA
    this.orderListB = orderListB
  }
}
