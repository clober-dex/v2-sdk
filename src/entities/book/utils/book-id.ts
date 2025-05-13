import { encodeAbiParameters, keccak256, zeroAddress } from 'viem'

import {
  MAKER_DEFAULT_POLICY,
  TAKER_DEFAULT_POLICY,
} from '../../../constants/chain-configs/fee'
import { CHAIN_IDS } from '../../../constants/chain-configs/chain'

export const toBookId = (
  chainId: CHAIN_IDS,
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
        Number(MAKER_DEFAULT_POLICY[chainId].value),
        zeroAddress,
        Number(TAKER_DEFAULT_POLICY[chainId].value),
      ],
    ),
  )
  return BigInt(value) & (2n ** 192n - 1n)
}
