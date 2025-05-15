import { Currency } from '../currency/types'

export type TransactionType =
  | 'limit'
  | 'claim'
  | 'cancel'
  | 'market'
  | 'add-liquidity'
  | 'remove-liquidity'
  | 'swap'
  | 'unknown'

export type AnalyticsSnapshot = {
  timestamp: number
  activeUsers: number
  firstTimeUsers: number
  transactionTypeCounts: Record<TransactionType, number>

  volume24hUSD: number
  volume24hUSDMap: Record<`0x${string}`, { currency: Currency; usd: number }>

  protocolFees24hUSD: number
  protocolFees24hUSDMap: Record<
    `0x${string}`,
    { currency: Currency; usd: number }
  >

  totalValueLockedUSD: number
  totalValueLockedUSDMap: Record<
    `0x${string}`,
    { currency: Currency; usd: number }
  >
}

export type AnalyticsSummary = {
  accumulatedUniqueUsers: number
  accumulatedUniqueTransactions: number
  accumulatedVolumeUSD: number
  accumulatedProtocolFeesUSD: number
  accumulatedTotalValueLockedUSD: number
  analyticsSnapshots: AnalyticsSnapshot[]
}
