import { Account } from 'viem'

export type Transaction = {
  data: `0x${string}`
  gas: bigint
  gasPrice: bigint
  value: bigint
  to: `0x${string}`
  from: `0x${string}` | Account | undefined | null
}
