export type RawDepth = {
  unit: bigint
  tick: bigint
  rawAmount: bigint
}

export type Depth = {
  price: number
  baseAmount: bigint
}
