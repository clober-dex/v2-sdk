import type { Account } from 'viem'

import { CHAIN_IDS } from './constants/chain'
import type { Currency } from './model/currency'
import { OpenOrder } from './model/open-order'

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

export type Pool = {
  chainId: CHAIN_IDS
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

export type DefaultOptions = {
  rpcUrl?: string
  gasLimit?: bigint
  useSubgraph?: boolean
}

export type CurrencyFlow = {
  currency: Currency
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
