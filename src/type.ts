import { CHAIN_IDS } from './constants/chain'
import { Currency } from './model/currency'
import { Depth } from './model/depth'

export { CHAIN_IDS } from './constants/chain'
export { Currency } from './model/currency'
export { Depth } from './model/depth'

export type Market = {
  chainId: CHAIN_IDS
  quote: Currency
  base: Currency
  makerFee: number
  takerFee: number
  bids: Depth[]
  bidBookOpen: boolean
  asks: Depth[]
  askBookOpen: boolean
}
