import { Currency } from '../currency/types'

export type TransactionType =
  | 'Limit'
  | 'Claim'
  | 'Cancel'
  | 'Market'
  | 'Add-Liq'
  | 'Remove-Liq'
  | 'Swap'
  | 'Unknown'

export type AnalyticsSnapshot = {
  timestamp: number
  activeUsers: number
  firstTimeUsers: number
  transactionTypeCounts: Record<TransactionType, number>
  routerCounts: Record<`0x${string}`, number>

  volume24hUSD: number
  volume24hUSDMap: Record<`0x${string}`, { currency: Currency; usd: number }>

  protocolFees24hUSD: number
  protocolFees24hUSDMap: Record<
    `0x${string}`,
    { currency: Currency; usd: number }
  >

  poolTotalValueLockedUSD: number
  poolTotalValueLockedUSDMap: Record<
    `0x${string}`,
    { currency: Currency; usd: number }
  >

  totalValueLockedUSD: number
  totalValueLockedUSDMap: Record<
    `0x${string}`,
    { currency: Currency; usd: number }
  >
}

export type UserVolumeSnapshot = {
  timestamp: number
  volume24hUSD: number
  volume24hUSDMap: Record<`0x${string}`, { currency: Currency; usd: number }>
}

export type AnalyticsSummary = {
  accumulatedUniqueUsers: number
  accumulatedUniqueTransactions: number
  accumulatedUniqueSwapTransactions: number
  accumulatedVolumeUSD: number
  accumulatedProtocolFeesUSD: number
  analyticsSnapshots: AnalyticsSnapshot[]
}

export type TopUser = {
  address: `0x${string}`
  nativeVolume: number
  firstSeenTimestamp: number
  firstSeenBlockNumber: number
}
