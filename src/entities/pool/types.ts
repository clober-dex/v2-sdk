import { Currency, Currency6909 } from '../currency/types'
import {
  CHAIN_IDS,
  Currency6909Amount,
  CurrencyAmount,
  Market,
} from '../../types'

export type Pool = {
  chainId: CHAIN_IDS
  key: `0x${string}`
  market: Market
  isOpened: boolean
  strategy: `0x${string}`
  currencyA: Currency
  currencyB: Currency
  currencyLp: Currency6909
  liquidityA: {
    total: CurrencyAmount
    reserve: CurrencyAmount
    cancelable: CurrencyAmount
    claimable: CurrencyAmount
  }
  liquidityB: {
    total: CurrencyAmount
    reserve: CurrencyAmount
    cancelable: CurrencyAmount
    claimable: CurrencyAmount
  }
  totalSupply: Currency6909Amount
  orderListA: string[]
  orderListB: string[]
  paused: boolean
}

export type PoolSnapshot = {
  chainId: CHAIN_IDS
  key: `0x${string}`
  currencyA: Currency
  currencyB: Currency
  currencyLp: Currency6909
  volumeUSD24h: string
  lpPriceUSD: string
  totalTvlUSD: string
  totalSpreadProfitUSD: string
  initialLPInfo: {
    tokenA: CurrencyAmount
    tokenB: CurrencyAmount
    lpToken: Currency6909Amount
    lpPriceUSD: string
    timestamp: number
    txHash: `0x${string}`
  }
  performanceHistories: {
    timestamp: number
    spreadProfitUSD: string
    tvlUSD: string
    lpPriceUSD: string
    oraclePrice: string
    priceA: string
    priceAUSD: number
    priceB: string
    priceBUSD: number
    volumeA: CurrencyAmount
    volumeB: CurrencyAmount
    volumeUSD: string
  }[]
}

export type LastAmounts = {
  lastAmountA: bigint
  lastAmountB: bigint
}

export type StrategyPosition = {
  oraclePrice: bigint
  rate: string
  bidTick: bigint
  askTick: bigint
}
