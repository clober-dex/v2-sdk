export type Take = {
  transactionHash: `0x${string}`
  timestamp: number
  amount: number // base amount
  price: number
  amountUSD: number
  side: 'buy' | 'sell'
  user: `0x${string}`
}
