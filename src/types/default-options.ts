import type { BlockTag } from 'viem'

type DefaultOptions = {
  rpcUrl?: string
  blockTag?: BlockTag
}

export type DefaultReadContractOptions = DefaultOptions

export type DefaultWriteContractOptions = DefaultOptions & {
  gasLimit?: bigint
  gasPriceLimit?: bigint
}
