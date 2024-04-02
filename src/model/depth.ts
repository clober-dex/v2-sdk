export type RawDepth = {
  bookId: string
  unit: bigint
  tick: bigint
  rawAmount: bigint
}

export type Depth = {
  price: number
  baseAmount: bigint
}
