import { encodePacked, keccak256 } from 'viem'

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

export const toBytes32 = (value: `0x${string}`): `0x${string}` => {
  return `0x${value.slice(2, 66).padStart(64, '0')}`
}
