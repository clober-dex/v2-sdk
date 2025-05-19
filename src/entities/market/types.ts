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
  price: number
  priceUSD: number
  volume24hUSD: number
  totalValueLockedUSD: number
  priceChange24h: number
  createdAtTimestamp: number
  bidBookUpdatedAt: number
  askBookUpdatedAt: number
  fdv: number
}

export type ChartLog = {
  timestamp: number
  open: string
  high: string
  low: string
  close: string
  volume: string
}
