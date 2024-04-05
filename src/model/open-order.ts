import { Currency } from './currency'

export type OpenOrder = {
  id: string
  isBid: boolean
  inputCurrency: Currency
  outputCurrency: Currency
  txHash: `0x${string}`
  createdAt: number
  price: number
  amount: { currency: Currency; value: string }
  filled: { currency: Currency; value: string }
  claimed: { currency: Currency; value: string }
  claimable: { currency: Currency; value: string }
  cancelable: boolean
}
