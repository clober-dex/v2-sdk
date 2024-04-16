import type { Account } from 'viem'

import { CHAIN_IDS } from './constants/chain'
import type { Currency } from './model/currency'
import type { Depth } from './model/depth'

export { CHAIN_IDS } from './constants/chain'
export type { Currency } from './model/currency'
export type { Depth } from './model/depth'
export type { OpenOrder } from './model/open-order'

export type Market = {
  chainId: CHAIN_IDS
  quote: Currency
  base: Currency
  makerFee: number
  takerFee: number
  bids: Depth[]
  bidBookOpen: boolean
  asks: Depth[]
  askBookOpen: boolean
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

export type DefaultOptions = {
  rpcUrl?: string
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
