import { expect, test } from 'vitest'
import { createPublicClient, http } from 'viem'
import { arbitrumSepolia } from 'viem/chains'

import { toBookId } from '../src/utils/book-id'
import {
  MAKER_DEFAULT_POLICY,
  TAKER_DEFAULT_POLICY,
} from '../src/constants/fee'

import { FORK_URL } from './utils/constants'

const _abi = [
  {
    inputs: [
      {
        components: [
          {
            internalType: 'Currency',
            name: 'base',
            type: 'address',
          },
          {
            internalType: 'uint64',
            name: 'unit',
            type: 'uint64',
          },
          {
            internalType: 'Currency',
            name: 'quote',
            type: 'address',
          },
          {
            internalType: 'FeePolicy',
            name: 'makerPolicy',
            type: 'uint24',
          },
          {
            internalType: 'contract IHooks',
            name: 'hooks',
            type: 'address',
          },
          {
            internalType: 'FeePolicy',
            name: 'takerPolicy',
            type: 'uint24',
          },
        ],
        internalType: 'struct IBookManager.BookKey',
        name: 'bookKey',
        type: 'tuple',
      },
    ],
    name: 'toId',
    outputs: [
      {
        internalType: 'BookId',
        name: 'id',
        type: 'uint192',
      },
    ],
    stateMutability: 'pure',
    type: 'function',
  },
] as const

const BOOK_ID_WRAPPER_ADDRESS = '0xbBa11dC70D31578fA426FB0EaCed79EB844F93A7'

const publicClient = createPublicClient({
  chain: arbitrumSepolia,
  transport: http(FORK_URL),
})

test('check toBookId function', async () => {
  const bidBookKey = {
    base: '0x0000000000000000000000000000000000000000' as `0x${string}`,
    unit: 10n ** 12n,
    quote: '0x447ad4a108b5540c220f9f7e83723ac87c0f8fd8' as `0x${string}`,
    makerPolicy: MAKER_DEFAULT_POLICY[arbitrumSepolia.id],
    hooks: '0x0000000000000000000000000000000000000000' as `0x${string}`,
    takerPolicy: TAKER_DEFAULT_POLICY[arbitrumSepolia.id],
  }
  expect(
    await publicClient.readContract({
      address: BOOK_ID_WRAPPER_ADDRESS,
      abi: _abi,
      functionName: 'toId',
      args: [
        {
          base: bidBookKey.base,
          unit: bidBookKey.unit,
          quote: bidBookKey.quote,
          makerPolicy: Number(bidBookKey.makerPolicy.value),
          hooks: bidBookKey.hooks,
          takerPolicy: Number(bidBookKey.takerPolicy.value),
        },
      ],
    }),
  ).toBe(
    toBookId(
      bidBookKey.quote,
      bidBookKey.base,
      bidBookKey.makerPolicy,
      bidBookKey.takerPolicy,
      bidBookKey.unit,
    ),
  )

  const askBookKey = {
    base: '0x447ad4a108b5540c220f9f7e83723ac87c0f8fd8' as `0x${string}`,
    unit: 10n ** 1n,
    quote: '0x0000000000000000000000000000000000000000' as `0x${string}`,
    makerPolicy: MAKER_DEFAULT_POLICY[arbitrumSepolia.id],
    hooks: '0x0000000000000000000000000000000000000000' as `0x${string}`,
    takerPolicy: TAKER_DEFAULT_POLICY[arbitrumSepolia.id],
  }
  expect(
    await publicClient.readContract({
      address: BOOK_ID_WRAPPER_ADDRESS,
      abi: _abi,
      functionName: 'toId',
      args: [
        {
          base: askBookKey.base,
          unit: askBookKey.unit,
          quote: askBookKey.quote,
          makerPolicy: Number(askBookKey.makerPolicy.value),
          hooks: askBookKey.hooks,
          takerPolicy: Number(askBookKey.takerPolicy.value),
        },
      ],
    }),
  ).toBe(
    toBookId(
      askBookKey.quote,
      askBookKey.base,
      askBookKey.makerPolicy,
      askBookKey.takerPolicy,
      askBookKey.unit,
    ),
  )
})
