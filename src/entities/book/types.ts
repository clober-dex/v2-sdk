import { Currency } from '../currency/types'

export type Depth = {
  price: string
  tick: number
  baseAmount: string
}

export type Book = {
  id: string
  base: Currency
  unitSize: string
  quote: Currency
  isOpened: boolean
}
