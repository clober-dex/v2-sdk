export type TakeEvent = {
  transactionHash: `0x${string}`
  logIndex: number
  timestamp: number
  blockNumber: number
  amount: number // base amount
  price: number
  amountUSD: number
  side: 'buy' | 'sell'
}

export type RebalanceEvent = {
  transactionHash: `0x${string}`
  logIndex: number
  timestamp: number
  blockNumber: number
  bidOrderList: { price: string; size: string }[]
  askOrderList: { price: string; size: string }[]
  quoteReserve: string
  baseReserve: string
}
