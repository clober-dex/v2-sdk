import { expect, test } from 'vitest'
import { createPublicClient, getAddress, http, zeroAddress } from 'viem'
import { arbitrumSepolia } from 'viem/chains'
import { Currency, getPrice, getTick } from '@clober/v2-sdk'

import { fromPrice, toPrice } from '../src/utils/tick'
import { baseToQuote, quoteToBase } from '../src/utils/decimals'

import { FORK_URL } from './utils/constants'

const _abi = [
  {
    inputs: [
      {
        internalType: 'Tick',
        name: 'tick',
        type: 'int24',
      },
      {
        internalType: 'uint256',
        name: 'base',
        type: 'uint256',
      },
      {
        internalType: 'bool',
        name: 'roundingUp',
        type: 'bool',
      },
    ],
    name: 'baseToQuote',
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
        internalType: 'uint256',
        name: 'price',
        type: 'uint256',
      },
    ],
    name: 'fromPrice',
    outputs: [
      {
        internalType: 'int24',
        name: '',
        type: 'int24',
      },
    ],
    stateMutability: 'pure',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'Tick',
        name: 'tick',
        type: 'int24',
      },
      {
        internalType: 'uint256',
        name: 'quote',
        type: 'uint256',
      },
      {
        internalType: 'bool',
        name: 'roundingUp',
        type: 'bool',
      },
    ],
    name: 'quoteToBase',
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
        internalType: 'int24',
        name: 'tick',
        type: 'int24',
      },
    ],
    name: 'toPrice',
    outputs: [
      {
        internalType: 'uint256',
        name: 'price',
        type: 'uint256',
      },
    ],
    stateMutability: 'pure',
    type: 'function',
  },
] as const

const TICK_WRAPPER_ADDRESS =
  '0xBEB8502F63A7c34a9591D3Fd1eEBca18a41FA0c8' as `0x${string}`

const MAX_TICK = Math.pow(2, 19) - 1
const MIN_TICK = -1 * MAX_TICK

const MIN_PRICE = 1350587n
const MAX_PRICE = 4647684107270898330752324302845848816923571339324334n

const publicClient = createPublicClient({
  chain: arbitrumSepolia,
  transport: http(FORK_URL),
})

const randomInteger = (start: number, end: number) => {
  return Math.floor(Math.random() * (end - start + 1) + start)
}

test('index to price', async () => {
  const randomPriceIndices = [
    MIN_TICK,
    ...Array.from({ length: 500 }, () => randomInteger(-500000, 500000)),
    MAX_TICK,
  ]
  const actualPrices = (
    (await publicClient.multicall({
      contracts: randomPriceIndices.map((priceIndex) => ({
        address: getAddress(TICK_WRAPPER_ADDRESS),
        abi: _abi,
        functionName: 'toPrice',
        args: [priceIndex],
      })),
    })) as { result: bigint }[]
  ).map(({ result }) => result)

  const expectedPrices = randomPriceIndices.map((priceIndex) =>
    toPrice(BigInt(priceIndex)),
  )
  expect(expectedPrices).toEqual(actualPrices)
})

test('get tick in bid & get price in bid', async () => {
  const args = {
    chainId: arbitrumSepolia.id,
    inputCurrency: {
      address: '0x00BFD44e79FB7f6dd5887A9426c8EF85A0CD23e0',
      name: 'USD Coin',
      symbol: 'USDC',
      decimals: 6,
    } as Currency,
    outputCurrency: {
      address: zeroAddress,
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
    } as Currency,
  }
  const tick1 = getTick({
    ...args,
    price: '9999',
  })
  const tick2 = getTick({
    ...args,
    price: '10000',
  })
  const tick3 = getTick({
    ...args,
    price: '10001',
  })
  expect(tick2 + 1n).toEqual(tick3)

  const price1 = getPrice({
    ...args,
    tick: tick1,
  })
  const price2 = getPrice({
    ...args,
    tick: tick2,
  })
  const price3 = getPrice({
    ...args,
    tick: tick3,
  })
  expect(price1).toEqual('9999.01772376')
  expect(price2).toEqual('10000.01762553')
  expect(price3).toEqual('10001.01762729')
})

test('get tick in ask & get price in ask', async () => {
  const args = {
    chainId: arbitrumSepolia.id,
    outputCurrency: {
      address: '0x00BFD44e79FB7f6dd5887A9426c8EF85A0CD23e0',
      name: 'USD Coin',
      symbol: 'USDC',
      decimals: 6,
    } as Currency,
    inputCurrency: {
      address: zeroAddress,
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
    } as Currency,
  }
  const tick1 = getTick({
    ...args,
    price: '9999',
  })
  const tick2 = getTick({
    ...args,
    price: '10000',
  })
  const tick3 = getTick({
    ...args,
    price: '10001',
  })
  expect(tick2 - 1n).toEqual(tick3)

  const price1 = getPrice({
    ...args,
    tick: tick1,
  })
  const price2 = getPrice({
    ...args,
    tick: tick2,
  })
  const price3 = getPrice({
    ...args,
    tick: tick3,
  })
  expect(price1).toEqual('9999.01772376')
  expect(price2).toEqual('10000.01762553')
  expect(price3).toEqual('10001.01762729')
})

test('price to index', async () => {
  const randomPriceIndices = [
    MIN_TICK,
    ...Array.from({ length: 500 }, () => randomInteger(-500000, 500000)),
    MAX_TICK,
  ]

  const actualPrices = (
    (await publicClient.multicall({
      contracts: randomPriceIndices.map((priceIndex) => ({
        address: TICK_WRAPPER_ADDRESS,
        abi: _abi,
        functionName: 'toPrice',
        args: [priceIndex],
      })),
    })) as { result: bigint }[]
  ).map(({ result }) => result)

  const actualPriceIndices = (
    (await publicClient.multicall({
      contracts: actualPrices.map((price) => ({
        address: TICK_WRAPPER_ADDRESS,
        abi: _abi,
        functionName: 'fromPrice',
        args: [price],
      })),
    })) as { result: number }[]
  ).map(({ result }) => BigInt(result))
  const expectedPriceIndices = actualPrices.map((price) => fromPrice(price))
  expect(expectedPriceIndices).toEqual(actualPriceIndices)
})

test('price to index for min and max', async () => {
  const actualPrices = [MIN_PRICE, MAX_PRICE]
  const actualPriceIndices = (
    (await publicClient.multicall({
      contracts: actualPrices.map((price) => ({
        address: TICK_WRAPPER_ADDRESS,
        abi: _abi,
        functionName: 'fromPrice',
        args: [price],
      })),
    })) as { result: number }[]
  ).map(({ result }) => BigInt(result))
  const expectedPriceIndices = actualPrices.map((price) => fromPrice(price))
  expect(expectedPriceIndices).toEqual(actualPriceIndices)
})

test('quote to base', async () => {
  const randomPriceIndices = Array.from({ length: 100 }, () =>
    randomInteger(-100000, 100000),
  )
  const actual = (
    (await publicClient.multicall({
      contracts: randomPriceIndices.map((priceIndex) => ({
        address: TICK_WRAPPER_ADDRESS,
        abi: _abi,
        functionName: 'quoteToBase',
        args: [priceIndex, 1000000n, true],
      })),
    })) as { result: bigint }[]
  ).map(({ result }) => result)
  const expected = randomPriceIndices.map((priceIndex) =>
    quoteToBase(BigInt(priceIndex), 1000000n, true),
  )
  expect(expected).toEqual(actual)
})

test('base to quote', async () => {
  const randomPriceIndices = Array.from({ length: 100 }, () =>
    randomInteger(-100000, 100000),
  )
  const actual = (
    (await publicClient.multicall({
      contracts: randomPriceIndices.map((priceIndex) => ({
        address: TICK_WRAPPER_ADDRESS,
        abi: _abi,
        functionName: 'baseToQuote',
        args: [priceIndex, 1000000n, true],
      })),
    })) as { result: bigint }[]
  ).map(({ result }) => result)
  const expected = randomPriceIndices.map((priceIndex) =>
    baseToQuote(BigInt(priceIndex), 1000000n, true),
  )
  expect(expected).toEqual(actual)
})
