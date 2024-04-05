import { Account } from 'viem'

import { CHAIN_IDS } from './constants/chain'
import { Currency } from './model/currency'
import { Depth } from './model/depth'

export { CHAIN_IDS } from './constants/chain'
export { Currency } from './model/currency'
export { Depth } from './model/depth'
export { OpenOrder } from './model/open-order'

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

export type Transaction = {
  data: `0x${string}`
  gas: bigint
  gasPrice: bigint
  value: bigint
  to: `0x${string}`
  from: `0x${string}` | Account | undefined
}

export type PermitSignature = {
  deadline: bigint
  v: number
  r: `0x${string}`
  s: `0x${string}`
}
