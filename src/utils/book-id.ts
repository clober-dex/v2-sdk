import { encodeAbiParameters, keccak256, zeroAddress } from 'viem'

import { MAKER_DEFAULT_POLICY, TAKER_DEFAULT_POLICY } from '../constants/fee'

export const toBookId = (
  quote: `0x${string}`,
  base: `0x${string}`,
  unitSize: bigint,
) => {
  const value = keccak256(
    encodeAbiParameters(
      [
        { name: 'base', type: 'address' },
        { name: 'unitSize', type: 'uint64' },
        { name: 'quote', type: 'address' },
        { name: 'makerPolicy', type: 'uint24' },
        { name: 'hooks', type: 'address' },
        { name: 'takerPolicy', type: 'uint24' },
      ],
      [
        base,
        unitSize,
        quote,
        Number(MAKER_DEFAULT_POLICY.value),
        zeroAddress,
        Number(TAKER_DEFAULT_POLICY.value),
      ],
    ),
  )
  return BigInt(value) & (2n ** 192n - 1n)
}
