import { MAX_PRICE, MIN_PRICE, PRICE_PRECISION } from '../constants/price'
import { MAX_TICK, MIN_TICK } from '../constants/tick'

import { lnWad } from './math'

const _R0 = 0xfff97272373d413259a46990n
const _R1 = 0xfff2e50f5f656932ef12357cn
const _R2 = 0xffe5caca7e10e4e61c3624ean
const _R3 = 0xffcb9843d60f6159c9db5883n
const _R4 = 0xff973b41fa98c081472e6896n
const _R5 = 0xff2ea16466c96a3843ec78b3n
const _R6 = 0xfe5dee046a99a2a811c461f1n
const _R7 = 0xfcbe86c7900a88aedcffc83bn
const _R8 = 0xf987a7253ac413176f2b074cn
const _R9 = 0xf3392b0822b70005940c7a39n
const _R10 = 0xe7159475a2c29b7443b29c7fn
const _R11 = 0xd097f3bdfd2022b8845ad8f7n
const _R12 = 0xa9f746462d870fdf8a65dc1fn
const _R13 = 0x70d869a156d2a1b890bb3df6n
const _R14 = 0x31be135f97d08fd981231505n
const _R15 = 0x9aa508b5b7a84e1c677de54n
const _R16 = 0x5d6af8dedb81196699c329n
const _R17 = 0x2216e584f5fa1ea92604n
const _R18 = 0x48a170391f7dc42n

export const invertTick = (tick: bigint): bigint => {
  return -tick
}

export const invertPrice = (price: bigint): bigint => {
  return price ? (1n << (PRICE_PRECISION * 2n)) / price : 0n
}

export const fromPrice = (price: bigint): bigint => {
  if (price > MAX_PRICE || price < MIN_PRICE) {
    throw new Error('price is out of range')
  }
  const tick = (lnWad(price) * 42951820407860n) / 2n ** 128n
  if (toPrice(tick) > price) {
    return tick - 1n
  }
  return tick
}

export const toPrice = (tick: bigint): bigint => {
  if (tick > MAX_TICK || tick < MIN_TICK) {
    throw new Error('tick is out of range')
  }
  const absTick = tick < 0n ? -tick : tick
  let price = 0n
  if ((absTick & 0x1n) !== 0n) {
    price = _R0
  } else {
    price = 1n << PRICE_PRECISION
  }
  if ((absTick & 0x2n) != 0n) {
    price = (price * _R1) >> PRICE_PRECISION
  }
  if ((absTick & 0x4n) != 0n) {
    price = (price * _R2) >> PRICE_PRECISION
  }
  if ((absTick & 0x8n) != 0n) {
    price = (price * _R3) >> PRICE_PRECISION
  }
  if ((absTick & 0x10n) != 0n) {
    price = (price * _R4) >> PRICE_PRECISION
  }
  if ((absTick & 0x20n) != 0n) {
    price = (price * _R5) >> PRICE_PRECISION
  }
  if ((absTick & 0x40n) != 0n) {
    price = (price * _R6) >> PRICE_PRECISION
  }
  if ((absTick & 0x80n) != 0n) {
    price = (price * _R7) >> PRICE_PRECISION
  }
  if ((absTick & 0x100n) != 0n) {
    price = (price * _R8) >> PRICE_PRECISION
  }
  if ((absTick & 0x200n) != 0n) {
    price = (price * _R9) >> PRICE_PRECISION
  }
  if ((absTick & 0x400n) != 0n) {
    price = (price * _R10) >> PRICE_PRECISION
  }
  if ((absTick & 0x800n) != 0n) {
    price = (price * _R11) >> PRICE_PRECISION
  }
  if ((absTick & 0x1000n) != 0n) {
    price = (price * _R12) >> PRICE_PRECISION
  }
  if ((absTick & 0x2000n) != 0n) {
    price = (price * _R13) >> PRICE_PRECISION
  }
  if ((absTick & 0x4000n) != 0n) {
    price = (price * _R14) >> PRICE_PRECISION
  }
  if ((absTick & 0x8000n) != 0n) {
    price = (price * _R15) >> PRICE_PRECISION
  }
  if ((absTick & 0x10000n) != 0n) {
    price = (price * _R16) >> PRICE_PRECISION
  }
  if ((absTick & 0x20000n) != 0n) {
    price = (price * _R17) >> PRICE_PRECISION
  }
  if ((absTick & 0x40000n) != 0n) {
    price = (price * _R18) >> PRICE_PRECISION
  }
  if (tick > 0n) {
    price = 0x1000000000000000000000000000000000000000000000000n / price
  }

  return price
}
