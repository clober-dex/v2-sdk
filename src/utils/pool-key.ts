import { encodePacked, keccak256 } from 'viem'

export const toPoolKey = (bookIdA: bigint, bookIdB: bigint) => {
  if (bookIdA > bookIdB) {
    ;[bookIdA, bookIdB] = [bookIdB, bookIdA]
  }
  return keccak256(encodePacked(['uint192', 'uint192'], [bookIdA, bookIdB]))
}
