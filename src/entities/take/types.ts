import { CurrencyFlow } from '../../types'

export type Take = {
  transactionHash: `0x${string}`
  timestamp: number
  currencyIn: CurrencyFlow
  currencyOut: CurrencyFlow
  amountUSD: number
  side: 'buy' | 'sell'
  user: `0x${string}`
}
