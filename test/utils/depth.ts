import { Depth } from '@clober/v2-sdk'
import BigNumber from 'bignumber.js'

export const getSize = (depth: Depth[], from: number, to: number) => {
  return new BigNumber(
    (
      depth.find(
        ({ price }) => from <= Number(price) && Number(price) <= to,
      ) ?? {
        baseAmount: 0n,
      }
    ).baseAmount.toString(),
  )
}
