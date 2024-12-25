import { encodeAbiParameters, keccak256, zeroAddress } from 'viem'

import { FeePolicy } from '../model/fee-policy'

export const toBookId = (
  quote: `0x${string}`,
  base: `0x${string}`,
  makerPolicy: FeePolicy,
  takerPolicy: FeePolicy,
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
        Number(makerPolicy.value),
        zeroAddress,
        Number(takerPolicy.value),
      ],
    ),
  )
  return BigInt(value) & (2n ** 192n - 1n)
}
