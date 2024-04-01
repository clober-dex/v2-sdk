import { encodeAbiParameters, keccak256 } from 'viem'

import type { BookKey } from '../model/book-key'

export const toBookId = (key: BookKey) => {
  const value = keccak256(
    encodeAbiParameters(
      [
        { name: 'base', type: 'address' },
        { name: 'unit', type: 'uint64' },
        { name: 'quote', type: 'address' },
        { name: 'makerPolicy', type: 'uint24' },
        { name: 'hooks', type: 'address' },
        { name: 'takerPolicy', type: 'uint24' },
      ],
      [
        key.base,
        key.unit,
        key.quote,
        Number(key.makerPolicy.value),
        key.hooks,
        Number(key.takerPolicy.value),
      ],
    ),
  )
  return BigInt(value) & (2n ** 192n - 1n)
}
