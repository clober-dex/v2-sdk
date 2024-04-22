import { encodeAbiParameters, keccak256, zeroAddress } from 'viem'

import { MAKER_DEFAULT_POLICY, TAKER_DEFAULT_POLICY } from '../constants/fee'

export const toBookId = (
  quote: `0x${string}`,
  base: `0x${string}`,
  unit: bigint,
) => {
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
        base,
        unit,
        quote,
        Number(MAKER_DEFAULT_POLICY.value),
        zeroAddress,
        Number(TAKER_DEFAULT_POLICY.value),
      ],
    ),
  )
  return BigInt(value) & (2n ** 192n - 1n)
}
