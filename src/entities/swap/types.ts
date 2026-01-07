import { CurrencyFlow, Transaction } from '../../types'

export type Swap = {
  transaction: Transaction & {
    id: `0x${string}`
  }
  timestamp: number
  currencyIn: CurrencyFlow
  currencyOut: CurrencyFlow
  amountUSD: number
  router: `0x${string}`
}
