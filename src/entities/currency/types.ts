export type Currency = {
  address: `0x${string}`
  name: string
  symbol: string
  decimals: number
}

export type Currency6909 = {
  address: `0x${string}`
  id: `0x${string}`
  name: string
  symbol: string
  decimals: number
}

export type CurrencyAmount = { currency: Currency; value: string }
export type Currency6909Amount = { currency: Currency6909; value: string }

export type CurrencyFlow = {
  currency: Currency
  amount: string
  direction: 'in' | 'out'
}

export type Currency6909Flow = {
  currency: Currency6909
  amount: string
  direction: 'in' | 'out'
}
