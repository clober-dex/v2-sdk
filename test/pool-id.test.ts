import { expect, test } from 'vitest'
import { createPublicClient, http } from 'viem'
import { arbitrumSepolia } from 'viem/chains'

import { toBookId } from '../src/utils/book-id'
import { toPoolId } from '../src/utils/pool-id'

import { FORK_URL } from './utils/constants'

const _abi = [
  {
    inputs: [
      {
        internalType: 'BookId',
        name: 'bookIdA',
        type: 'uint192',
      },
      {
        internalType: 'BookId',
        name: 'bookIdB',
        type: 'uint192',
      },
    ],
    name: 'encodeKey',
    outputs: [
      {
        internalType: 'bytes32',
        name: '',
        type: 'bytes32',
      },
    ],
    stateMutability: 'pure',
    type: 'function',
  },
] as const

const POOL_ID_WRAPPER_ADDRESS = '0xE7af7E0b3b45999C0166692cEa2b619eF88f1a65'

const publicClient = createPublicClient({
  chain: arbitrumSepolia,
  transport: http(FORK_URL),
})

const BID_BOOK_ID = toBookId(
  arbitrumSepolia.id,
  '0x447ad4a108b5540c220f9f7e83723ac87c0f8fd8',
  '0x0000000000000000000000000000000000000000',
  10n ** 12n,
)
const ASK_BID_ID = toBookId(
  arbitrumSepolia.id,
  '0x0000000000000000000000000000000000000000',
  '0x447ad4a108b5540c220f9f7e83723ac87c0f8fd8',
  1n,
)

test('check encodeKey function', async () => {
  expect(
    await publicClient.readContract({
      address: POOL_ID_WRAPPER_ADDRESS,
      abi: _abi,
      functionName: 'encodeKey',
      args: [ASK_BID_ID, BID_BOOK_ID],
    }),
  ).toBe(toPoolId(ASK_BID_ID, BID_BOOK_ID))

  expect(
    await publicClient.readContract({
      address: POOL_ID_WRAPPER_ADDRESS,
      abi: _abi,
      functionName: 'encodeKey',
      args: [ASK_BID_ID, BID_BOOK_ID],
    }),
  ).toBe(toPoolId(BID_BOOK_ID, ASK_BID_ID))
})
