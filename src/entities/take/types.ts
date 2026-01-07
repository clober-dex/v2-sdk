export type Take = {
  transactionHash: `0x${string}`
  logIndex: number
  timestamp: number
  blockNumber: number
  amount: number // base amount
  price: number
  amountUSD: number
  side: 'buy' | 'sell'
}
