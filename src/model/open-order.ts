import type { Currency } from './currency'

export type OpenOrderDto = {
  id: string
  book: {
    id: string
    base: {
      id: string
      name: string
      symbol: string
      decimals: string
    }
    quote: {
      id: string
      name: string
      symbol: string
      decimals: string
    }
    unit: string
  }
  tick: string
  txHash: string
  createdAt: string
  rawAmount: string
  rawFilledAmount: string
  rawClaimedAmount: string
  rawClaimableAmount: string
}

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
