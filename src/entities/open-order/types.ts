import { CurrencyAmount } from '../../types'
import type { Currency } from '../currency/types'

export type OnChainOpenOrder = {
  id: string
  user: `0x${string}`
  isBid: boolean
  inputCurrency: Currency
  outputCurrency: Currency
  price: string
  tick: number
  orderIndex: string
  claimable: CurrencyAmount
  cancelable: CurrencyAmount
}

export type OpenOrder = OnChainOpenOrder & {
  createdAt: number
  amount: CurrencyAmount
  filled: CurrencyAmount
  claimed: CurrencyAmount
}
