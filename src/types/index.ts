import type { Account } from 'viem'

export { CHAIN_IDS } from '../constants/chain-configs/chain'
export type {
  Currency,
  Currency6909,
  CurrencyAmount,
  Currency6909Amount,
  CurrencyFlow,
  Currency6909Flow,
} from '../entities/currency/types'
export type { OpenOrder, OnChainOpenOrder } from '../entities/open-order/types'
export type { Book, Depth } from '../entities/book/types'
export type {
  Market,
  MarketSnapshot,
  ChartLog,
  CHART_LOG_INTERVALS,
} from '../entities/market/types'
export type {
  Pool,
  PoolSnapshot,
  LastAmounts,
  StrategyPosition,
} from '../entities/pool/types'

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

export type ERC20PermitParam = {
  token: `0x${string}`
  permitAmount: bigint
  signature: PermitSignature
}

type DefaultOptions = {
  rpcUrl?: string
}

export type DefaultReadContractOptions = DefaultOptions

export type DefaultWriteContractOptions = DefaultOptions & {
  gasLimit?: bigint
  gasPriceLimit?: bigint
}
