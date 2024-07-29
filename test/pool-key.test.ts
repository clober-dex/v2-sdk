import { expect, test } from 'vitest'
import { createPublicClient, http } from 'viem'
import { arbitrumSepolia } from 'viem/chains'

import { toBookId } from '../src/utils/book-id'
import { toPoolKey } from '../src/utils/pool-key'

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
      {
        internalType: 'bytes32',
        name: 'salt',
        type: 'bytes32',
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

const POOL_KEY_WRAPPER_ADDRESS = '0xacC73989c94f749D3eb958206f409674474868E2'

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
const SALT =
  '0x0000000000000000000000000000000000000000000000000000000000000000'

test('check encodeKey function', async () => {
  expect(
    await publicClient.readContract({
      address: POOL_KEY_WRAPPER_ADDRESS,
      abi: _abi,
      functionName: 'encodeKey',
      args: [ASK_BID_ID, BID_BOOK_ID, SALT],
    }),
  ).toBe(toPoolKey(ASK_BID_ID, BID_BOOK_ID, SALT))

  expect(
    await publicClient.readContract({
      address: POOL_KEY_WRAPPER_ADDRESS,
      abi: _abi,
      functionName: 'encodeKey',
      args: [ASK_BID_ID, BID_BOOK_ID, SALT],
    }),
  ).toBe(toPoolKey(BID_BOOK_ID, ASK_BID_ID, '0x'))
})
