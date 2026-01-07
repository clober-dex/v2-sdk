export type Take = {
  transactionHash: `0x${string}`
  timestamp: number
  blockNumber: number
  amount: number // base amount
  price: number
  amountUSD: number
  side: 'buy' | 'sell'
}
