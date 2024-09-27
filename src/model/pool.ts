import { formatUnits } from 'viem'

import { CHAIN_IDS, Currency } from '../type'
import { CONTRACT_ADDRESSES } from '../constants/addresses'
import { toPoolKey } from '../utils/pool-key'

import { Market } from './market'
import { Currency6909 } from './currency'

export class Pool {
  key: `0x${string}`
  market: Market
  isOpened: boolean
  strategy: `0x${string}`
  currencyA: Currency
  currencyB: Currency
  currencyLp: Currency6909

  totalSupply: bigint
  decimals: number
  reserveA: string
  reserveB: string
  liquidityA: bigint
  liquidityB: bigint
  cancelableA: bigint
  cancelableB: bigint
  claimableA: bigint
  claimableB: bigint
  orderListA: bigint[]
  orderListB: bigint[]

  constructor({
    chainId,
    market,
    isOpened,
    bookIdA,
    bookIdB,
    salt,
    poolKey,
    totalSupply,
    decimals,
    reserveA,
    reserveB,
    liquidityA,
    liquidityB,
    cancelableA,
    cancelableB,
    claimableA,
    claimableB,
    orderListA,
    orderListB,
  }: {
    chainId: CHAIN_IDS
    market: Market
    isOpened: boolean
    bookIdA: bigint
    bookIdB: bigint
    salt: `0x${string}`
    poolKey: `0x${string}`
    totalSupply: bigint
    decimals: number
    reserveA: bigint
    reserveB: bigint
    liquidityA: bigint
    liquidityB: bigint
    cancelableA: bigint
    cancelableB: bigint
    claimableA: bigint
    claimableB: bigint
    orderListA: bigint[]
    orderListB: bigint[]
  }) {
    this.key = toPoolKey(bookIdA, bookIdB, salt)
    this.market = market
    this.isOpened = isOpened
    this.strategy = CONTRACT_ADDRESSES[chainId]!.Strategy
    if (bookIdA === market.bidBook.id && bookIdB === market.askBook.id) {
      this.currencyA = market.bidBook.quote // or market.askBook.base
      this.currencyB = market.bidBook.base // or market.askBook.quote
    } else if (bookIdA === market.askBook.id && bookIdB === market.bidBook.id) {
      this.currencyA = market.askBook.quote // or market.bidBook.base
      this.currencyB = market.askBook.base // or market.bidBook.quote
    } else if (bookIdA === 0n && bookIdB === 0n) {
      // pool is not opened, so we don't know the currency pair
      this.currencyA = market.bidBook.base
      this.currencyB = market.askBook.base
    } else {
      throw new Error('Invalid book id')
    }
    this.currencyLp = {
      address: CONTRACT_ADDRESSES[chainId]!.Rebalancer,
      id: BigInt(poolKey),
      name: `${this.currencyA.symbol}-${this.currencyB.symbol} LP Token`,
      symbol: `${this.currencyA.symbol}-${this.currencyB.symbol}`,
      decimals: decimals,
    }
    this.totalSupply = totalSupply
    this.decimals = decimals
    this.liquidityA = liquidityA
    this.liquidityB = liquidityB
    this.cancelableA = cancelableA
    this.cancelableB = cancelableB
    this.claimableA = claimableA
    this.claimableB = claimableB
    this.reserveA = formatUnits(reserveA, this.currencyA.decimals)
    this.reserveB = formatUnits(reserveB, this.currencyB.decimals)
    this.orderListA = orderListA
    this.orderListB = orderListB
  }
}
