import { encodeAbiParameters, keccak256, zeroAddress } from 'viem'

import { MAKER_DEFAULT_POLICY, TAKER_DEFAULT_POLICY } from '../constants/fee'

export const toBookId = (
  inputToken: `0x${string}`,
  outputToken: `0x${string}`,
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
        outputToken,
        unit,
        inputToken,
        Number(MAKER_DEFAULT_POLICY.value),
        zeroAddress,
        Number(TAKER_DEFAULT_POLICY.value),
      ],
    ),
  )
  return BigInt(value) & (2n ** 192n - 1n)
}
