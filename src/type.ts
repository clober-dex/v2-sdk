import type { Account } from 'viem'

import { CHAIN_IDS } from './constants/chain'
import type { Currency, Currency6909 } from './model/currency'

export { CHAIN_IDS } from './constants/chain'
export type { Currency } from './model/currency'
export type { OpenOrder } from './model/open-order'

export type Depth = {
  price: string
  tick: number
  baseAmount: string
}

export type Book = {
  id: string
  base: Currency
  unitSize: string
  quote: Currency
  isOpened: boolean
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

export type Market = {
  chainId: CHAIN_IDS
  quote: Currency
  base: Currency
  makerFee: number
  takerFee: number
  bids: Depth[]
  bidBook: Book
  asks: Depth[]
  askBook: Book
}

export type MarketSnapshot = {
  chainId: CHAIN_IDS
  marketId: string
  base: Currency
  quote: Currency
  priceUSD: number
  volume24hUSD: number
  priceChange24h: number
  createdAtTimestamp: number
}

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
    priceB: string
    volumeA: CurrencyAmount
    volumeB: CurrencyAmount
    volumeUSD: string
  }[]
}

export type Transaction = {
  data: `0x${string}`
  gas: bigint
  gasPrice: bigint
  value: bigint
  to: `0x${string}`
  from: `0x${string}` | Account | undefined
}

export type PermitSignature = {
  deadline: bigint
  v: number
  r: `0x${string}`
  s: `0x${string}`
}

export type ERC20PermitParam = {
  token: `0x${string}`
  permitAmount: bigint
  signature: PermitSignature
}

type DefaultOptions = {
  rpcUrl?: string
}

export type DefaultReadContractOptions = DefaultOptions

export type DefaultWriteContractOptions = DefaultOptions & {
  gasLimit?: bigint
  gasPriceLimit?: bigint
}

export type CurrencyFlow = {
  currency: Currency
  amount: string
  direction: 'in' | 'out'
}

export type Currency6909Flow = {
  currency: Currency6909
  amount: string
  direction: 'in' | 'out'
}

export type ChartLog = {
  timestamp: number
  open: string
  high: string
  low: string
  close: string
  volume: string
}

export enum CHART_LOG_INTERVALS {
  oneMinute = '1m',
  threeMinutes = '3m',
  fiveMinutes = '5m',
  tenMinutes = '10m',
  fifteenMinutes = '15m',
  thirtyMinutes = '30m',
  oneHour = '1h',
  twoHours = '2h',
  fourHours = '4h',
  sixHours = '6h',
  oneDay = '1d',
  oneWeek = '1w',
}

export type CurrencyAmount = { currency: Currency; value: string }
export type Currency6909Amount = { currency: Currency6909; value: string }
