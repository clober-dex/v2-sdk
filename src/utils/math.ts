export const divide = (x: bigint, y: bigint, roundUp: boolean): bigint => {
  if (roundUp) {
    if (x === 0n) {
      return 0n
    } else {
      return (x - 1n) / y + 1n
    }
  } else {
    return x / y
  }
}

export const mostSignificantBit = (x: bigint): bigint => {
  return BigInt(Math.floor(Math.log2(Number(x))))
}

export const log2 = (x: bigint): bigint => {
  const msb = mostSignificantBit(x)

  if (msb > 128n) {
    x >>= msb - 128n
  } else if (msb < 128n) {
    x <<= 128n - msb
  }

  x &= 0xffffffffffffffffffffffffffffffffn

  let result = (msb - 128n) << 128n
  let bit = 0x80000000000000000000000000000000n
  for (let i = 0n; i < 128n && x > 0n; i++) {
    x = (x << 1n) + ((x * x + 0x80000000000000000000000000000000n) >> 128n)
    if (x > 0xffffffffffffffffffffffffffffffffn) {
      result |= bit
      x = (x >> 1n) - 0x80000000000000000000000000000000n
    }
    bit >>= 1n
  }

  return result
}
