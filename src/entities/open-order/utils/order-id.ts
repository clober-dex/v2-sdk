export const fromOrderId = (
  orderId: bigint,
): {
  bookId: bigint
  tick: bigint
  index: bigint
} => {
  const tick = (orderId >> 40n) & (2n ** 24n - 1n)
  return {
    bookId: orderId >> 64n,
    tick: tick & (2n ** 23n) ? -(2n ** 24n - tick) : tick,
    index: orderId & (2n ** 40n - 1n),
  }
}

export const toOrderId = (
  bookId: bigint,
  tick: bigint,
  orderIndex: bigint,
): bigint => {
  const tickU24 = tick & (2n ** 24n - 1n)
  return orderIndex + (tickU24 << 40n) + (bookId << 64n)
}
