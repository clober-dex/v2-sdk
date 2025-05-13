type DefaultOptions = {
  rpcUrl?: string
}

export type DefaultReadContractOptions = DefaultOptions

export type DefaultWriteContractOptions = DefaultOptions & {
  gasLimit?: bigint
  gasPriceLimit?: bigint
}
