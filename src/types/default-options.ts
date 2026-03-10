import type { BlockTag } from 'viem'

type DefaultOptions = {
  rpcUrl?: string
}

export type DefaultReadContractOptions = DefaultOptions & {
  blockTag?: BlockTag
}

export type DefaultWriteContractOptions = DefaultOptions & {
  gasLimit?: bigint
  gasPriceLimit?: bigint
}
