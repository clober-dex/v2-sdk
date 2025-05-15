import BigNumber from 'bignumber.js'

export const getSize = (depth: any[], from: number, to: number) => {
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
