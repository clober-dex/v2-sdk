import { expect, test } from 'vitest'
import { createPublicClient, getAddress, http } from 'viem'
import { arbitrumSepolia } from 'viem/chains'

import { lnWad } from '../src/utils/math'

import { FORK_URL } from './constants'

const publicClient = createPublicClient({
  chain: arbitrumSepolia,
  transport: http(FORK_URL),
})

const _abi = [
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'a',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'b',
        type: 'uint256',
      },
      {
        internalType: 'bool',
        name: 'roundingUp',
        type: 'bool',
      },
    ],
    name: 'divide',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'pure',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'int256',
        name: 'x',
        type: 'int256',
      },
    ],
    name: 'lnWad',
    outputs: [
      {
        internalType: 'int256',
        name: '',
        type: 'int256',
      },
    ],
    stateMutability: 'pure',
    type: 'function',
  },
] as const

const MATH_WRAPPER_ADDRESS = '0x98d55f0AaEda3bad7815C8F3d8f8882e6B702D26'

const randomInteger = (start: number, end: number) => {
  return Math.floor(Math.random() * (end - start + 1) + start)
}

const MIN_PRICE = 1350587n
const MAX_PRICE = 4647684107270898330752324302845848816923571339324334n

test('lnWad', async () => {
  const randomValues = [
    MIN_PRICE,
    ...Array.from({ length: 500 }, () =>
      randomInteger(Number(MIN_PRICE + 1n), Number(MAX_PRICE - 1n)),
    ),
    MAX_PRICE,
  ]
  const actualValues = (
    (await publicClient.multicall({
      contracts: randomValues.map((value) => ({
        address: getAddress(MATH_WRAPPER_ADDRESS),
        abi: _abi,
        functionName: 'lnWad',
        args: [value],
      })),
    })) as { result: bigint }[]
  ).map(({ result }) => result)

  const expectedValues = randomValues.map((priceIndex) =>
    lnWad(BigInt(priceIndex)),
  )
  expect(expectedValues).toEqual(actualValues)
})
