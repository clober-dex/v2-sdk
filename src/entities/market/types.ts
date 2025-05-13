import { CHAIN_IDS } from '../../constants/chain-configs/chain'
import { Currency } from '../currency/types'
import { Book, Depth } from '../book/types'

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
