import { formatUnits } from 'viem'

import { CHAIN_IDS, Currency, Market, Pool as PoolType } from '../../types'
import { CONTRACT_ADDRESSES } from '../../constants/chain-configs/addresses'
import { Currency6909 } from '../currency/model'

export class Pool {
  chainId: CHAIN_IDS
  key: `0x${string}`
  market: Market
  isOpened: boolean
  strategy: `0x${string}`
  currencyA: Currency
  currencyB: Currency
  currencyLp: Currency6909

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
  paused: boolean

  constructor({
    chainId,
    market,
    isOpened,
    bookIdA,
    bookIdB,
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
    paused,
  }: {
    chainId: CHAIN_IDS
    market: Market
    isOpened: boolean
    bookIdA: bigint
    bookIdB: bigint
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
    paused: boolean
  }) {
    this.chainId = chainId
    this.key = poolKey
    this.market = market
    this.isOpened = isOpened
    this.strategy = CONTRACT_ADDRESSES[chainId]!.Strategy
    if (
      bookIdA === BigInt(market.bidBook.id) &&
      bookIdB === BigInt(market.askBook.id)
    ) {
      this.currencyA = market.bidBook.quote // or market.askBook.base
      this.currencyB = market.bidBook.base // or market.askBook.quote
    } else if (
      bookIdA === BigInt(market.askBook.id) &&
      bookIdB === BigInt(market.bidBook.id)
    ) {
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
      id: poolKey,
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
    this.reserveA = reserveA
    this.reserveB = reserveB
    this.orderListA = orderListA
    this.orderListB = orderListB
    this.paused = paused
  }

  toJson = (): PoolType => {
    return {
      chainId: this.chainId,
      key: this.key,
      market: this.market,
      isOpened: this.isOpened,
      strategy: this.strategy,
      currencyA: this.currencyA,
      currencyB: this.currencyB,
      currencyLp: this.currencyLp,
      liquidityA: {
        total: {
          currency: this.currencyA,
          value: formatUnits(this.liquidityA, this.currencyA.decimals),
        },
        reserve: {
          currency: this.currencyA,
          value: formatUnits(this.reserveA, this.currencyA.decimals),
        },
        cancelable: {
          currency: this.currencyA,
          value: formatUnits(this.cancelableA, this.currencyA.decimals),
        },
        claimable: {
          currency: this.currencyA,
          value: formatUnits(this.claimableA, this.currencyA.decimals),
        },
      },
      liquidityB: {
        total: {
          currency: this.currencyB,
          value: formatUnits(this.liquidityB, this.currencyB.decimals),
        },
        reserve: {
          currency: this.currencyB,
          value: formatUnits(this.reserveB, this.currencyB.decimals),
        },
        cancelable: {
          currency: this.currencyB,
          value: formatUnits(this.cancelableB, this.currencyB.decimals),
        },
        claimable: {
          currency: this.currencyB,
          value: formatUnits(this.claimableB, this.currencyB.decimals),
        },
      },
      totalSupply: {
        currency: this.currencyLp,
        value: formatUnits(this.totalSupply, this.decimals),
      },
      orderListA: this.orderListA.map((order) => order.toString()),
      orderListB: this.orderListB.map((order) => order.toString()),
      paused: this.paused,
    }
  }
}
