import { Depth } from '@clober/v2-sdk'

export const getSize = (depth: Depth[], from: number, to: number) => {
  return Number(
    (
      depth.find(({ price }) => from <= price && price <= to) ?? {
        baseAmount: 0n,
      }
    ).baseAmount,
  )
}
