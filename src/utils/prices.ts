export const formatPrice = (
  price: bigint,
  quoteDecimals: number,
  baseDecimals: number,
): number => {
  return (
    (Number(price) / Math.pow(2, 128)) * 10 ** (baseDecimals - quoteDecimals)
  )
}

export const parsePrice = (
  price: number,
  quoteDecimals: number,
  baseDecimals: number,
): bigint => {
  return BigInt(
    price * Math.pow(2, 128) * Math.pow(10, quoteDecimals - baseDecimals),
  )
}
