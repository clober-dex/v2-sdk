import { log2 } from './math'

const MAX_UINT256 = 2n ** 256n - 1n

const R0 = 0xfff97272373d413259a46990580e2139n // 2^128 / r^(2^0)
const R1 = 0xfff2e50f5f656932ef12357cf3c7fdcbn
const R2 = 0xffe5caca7e10e4e61c3624eaa0941ccfn
const R3 = 0xffcb9843d60f6159c9db58835c926643n
const R4 = 0xff973b41fa98c081472e6896dfb254bfn
const R5 = 0xff2ea16466c96a3843ec78b326b52860n
const R6 = 0xfe5dee046a99a2a811c461f1969c3052n
const R7 = 0xfcbe86c7900a88aedcffc83b479aa3a3n
const R8 = 0xf987a7253ac413176f2b074cf7815e53n
const R9 = 0xf3392b0822b70005940c7a398e4b70f2n
const R10 = 0xe7159475a2c29b7443b29c7fa6e889d8n
const R11 = 0xd097f3bdfd2022b8845ad8f792aa5825n
const R12 = 0xa9f746462d870fdf8a65dc1f90e061e4n
const R13 = 0x70d869a156d2a1b890bb3df62baf32f6n
const R14 = 0x31be135f97d08fd981231505542fcfa5n
const R15 = 0x9aa508b5b7a84e1c677de54f3e99bc8n
const R16 = 0x5d6af8dedb81196699c329225ee604n
const R17 = 0x2216e584f5fa1ea926041bedfe97n
const R18 = 0x48a170391f7dc42444e8fa2n

export const fromPrice = (price: bigint): bigint => {
  const log = log2(price)
  const tick = log / 49089913871092318234424474366155889n
  const tickLow =
    (log -
      (price >> 128n == 0n
        ? 49089913871092318234424474366155887n
        : 84124744249948177485425n)) /
    49089913871092318234424474366155889n

  if (tick === tickLow) {
    return tick
  }

  if (toPrice(tick) <= price) {
    return tick
  }

  return tickLow
}

export const invertPrice = (price: bigint): bigint => {
  return price ? (1n << 256n) / price : 0n
}

export const toPrice = (tick: bigint): bigint => {
  const absTick = tick < 0n ? -tick : tick
  let price = 0n
  if ((absTick & 0x1n) !== 0n) {
    price = R0
  } else {
    price = 1n << 128n
  }
  if ((absTick & 0x2n) != 0n) {
    price = (price * R1) >> 128n
  }
  if ((absTick & 0x4n) != 0n) {
    price = (price * R2) >> 128n
  }
  if ((absTick & 0x8n) != 0n) {
    price = (price * R3) >> 128n
  }
  if ((absTick & 0x10n) != 0n) {
    price = (price * R4) >> 128n
  }
  if ((absTick & 0x20n) != 0n) {
    price = (price * R5) >> 128n
  }
  if ((absTick & 0x40n) != 0n) {
    price = (price * R6) >> 128n
  }
  if ((absTick & 0x80n) != 0n) {
    price = (price * R7) >> 128n
  }
  if ((absTick & 0x100n) != 0n) {
    price = (price * R8) >> 128n
  }
  if ((absTick & 0x200n) != 0n) {
    price = (price * R9) >> 128n
  }
  if ((absTick & 0x400n) != 0n) {
    price = (price * R10) >> 128n
  }
  if ((absTick & 0x800n) != 0n) {
    price = (price * R11) >> 128n
  }
  if ((absTick & 0x1000n) != 0n) {
    price = (price * R12) >> 128n
  }
  if ((absTick & 0x2000n) != 0n) {
    price = (price * R13) >> 128n
  }
  if ((absTick & 0x4000n) != 0n) {
    price = (price * R14) >> 128n
  }
  if ((absTick & 0x8000n) != 0n) {
    price = (price * R15) >> 128n
  }
  if ((absTick & 0x10000n) != 0n) {
    price = (price * R16) >> 128n
  }
  if ((absTick & 0x20000n) != 0n) {
    price = (price * R17) >> 128n
  }
  if ((absTick & 0x40000n) != 0n) {
    price = (price * R18) >> 128n
  }
  if (tick > 0n) {
    price = MAX_UINT256 / price
  }

  return price
}
