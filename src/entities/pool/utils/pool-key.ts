import { encodePacked, keccak256 } from 'viem'

import { toBytes32 } from './mint'

export const toPoolKey = (
  bookIdA: bigint,
  bookIdB: bigint,
  salt: `0x${string}`,
) => {
  if (bookIdA > bookIdB) {
    ;[bookIdA, bookIdB] = [bookIdB, bookIdA]
  }
  return keccak256(
    encodePacked(
      ['uint192', 'uint192', 'bytes32'],
      [bookIdA, bookIdB, toBytes32(salt)],
    ),
  )
}
