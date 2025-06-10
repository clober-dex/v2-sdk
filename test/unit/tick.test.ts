import { expect, test } from 'vitest'
import { createPublicClient, getAddress, http } from 'viem'
import { arbitrumSepolia } from 'viem/chains'
import {
  fromPrice,
  toPrice,
  baseToQuote,
  quoteToBase,
  getPriceNeighborhood,
  getMarketPrice,
} from 'v2-sdk/src'

import { FORK_URL } from '../utils/constants.ts'

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

test('check duplicate prices', () => {
  const map: {
    [key: string]: number
  } = {}
  for (let i = MIN_TICK; i < MAX_TICK; i += 1) {
    const price = toPrice(BigInt(i))
    if (map[price.toString()] !== undefined) {
      throw new Error(`Duplicate price ${price.toString()}`)
    }
    map[price.toString()] = i
  }
})

test('check get market price function', () => {
  expect(
    getMarketPrice({
      marketQuoteCurrency: {
        name: 'USDC',
        symbol: 'USDC',
        decimals: 6,
        address: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
      },
      marketBaseCurrency: {
        name: 'USDC',
        symbol: 'USDC',
        decimals: 6,
        address: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
      },
      bidTick: 0n,
    }),
  ).toBe('1')

  expect(
    getMarketPrice({
      marketQuoteCurrency: {
        name: 'USDC',
        symbol: 'USDC',
        decimals: 6,
        address: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
      },
      marketBaseCurrency: {
        name: 'ETH',
        symbol: 'ETH',
        decimals: 18,
        address: '0x0000000000000000000000000000000000000000',
      },
      bidTick: -188010n,
    }),
  ).toBe(
    '6842.86035160742006027458864603889967777325203067417813684869543067179620265960693359375',
  )

  expect(
    getMarketPrice({
      marketQuoteCurrency: {
        name: 'USDC',
        symbol: 'USDC',
        decimals: 6,
        address: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
      },
      marketBaseCurrency: {
        name: 'USDC',
        symbol: 'USDC',
        decimals: 6,
        address: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
      },
      askTick: 0n,
    }),
  ).toBe('1')

  expect(
    getMarketPrice({
      marketQuoteCurrency: {
        name: 'USDC',
        symbol: 'USDC',
        decimals: 6,
        address: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
      },
      marketBaseCurrency: {
        name: 'ETH',
        symbol: 'ETH',
        decimals: 18,
        address: '0x0000000000000000000000000000000000000000',
      },
      askTick: 188010n,
    }),
  ).toBe(
    '6842.86035160742006027458864603889967777325203067417813684869543067179620265960693359375',
  )

  expect(() =>
    getMarketPrice({
      marketQuoteCurrency: {
        name: 'USDC',
        symbol: 'USDC',
        decimals: 6,
        address: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
      },
      marketBaseCurrency: {
        name: 'ETH',
        symbol: 'ETH',
        decimals: 18,
        address: '0x0000000000000000000000000000000000000000',
      },
    }),
  ).toThrowError()
})

const checkNeighborhoodTicksAndPrices = (depth: {
  normal: {
    up: { tick: bigint; price: string }
    now: { tick: bigint; price: string }
    down: { tick: bigint; price: string }
  }
  inverted: {
    up: { tick: bigint; price: string }
    now: { tick: bigint; price: string }
    down: { tick: bigint; price: string }
  }
}) => {
  expect(Number(depth.normal.up.tick)).toBeGreaterThan(
    Number(depth.normal.now.tick),
  )
  expect(Number(depth.normal.up.price)).toBeGreaterThan(
    Number(depth.normal.now.price),
  )

  expect(Number(depth.normal.now.tick)).toBeGreaterThan(
    Number(depth.normal.down.tick),
  )
  expect(Number(depth.normal.now.price)).toBeGreaterThan(
    Number(depth.normal.down.price),
  )

  expect(Number(depth.inverted.up.tick)).toBeGreaterThan(
    Number(depth.inverted.now.tick),
  )
  expect(Number(depth.inverted.up.price)).toBeGreaterThan(
    Number(depth.inverted.now.price),
  )

  expect(Number(depth.inverted.now.tick)).toBeGreaterThan(
    Number(depth.inverted.down.tick),
  )
  expect(Number(depth.inverted.now.price)).toBeGreaterThan(
    Number(depth.inverted.down.price),
  )
}

test('neighborhood tick and price', async () => {
  const r1 = getPriceNeighborhood({
    chainId: arbitrumSepolia.id,
    price: '3010',
    currency0: {
      name: 'USDC',
      symbol: 'USDC',
      decimals: 6,
      address: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    },
    currency1: {
      name: 'ETH',
      symbol: 'ETH',
      decimals: 18,
      address: '0x0000000000000000000000000000000000000000',
    },
  })
  checkNeighborhoodTicksAndPrices(r1)

  const r2 = getPriceNeighborhood({
    chainId: arbitrumSepolia.id,
    price: '1.001',
    currency0: {
      name: 'USDC',
      symbol: 'USDC',
      decimals: 6,
      address: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    },
    currency1: {
      name: 'ETH',
      symbol: 'ETH',
      decimals: 18,
      address: '0x0000000000000000000000000000000000000000',
    },
  })
  checkNeighborhoodTicksAndPrices(r2)

  const r3 = getPriceNeighborhood({
    chainId: arbitrumSepolia.id,
    price: '0.0000012',
    currency0: {
      name: 'USDC',
      symbol: 'USDC',
      decimals: 6,
      address: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    },
    currency1: {
      name: 'ETH',
      symbol: 'ETH',
      decimals: 18,
      address: '0x0000000000000000000000000000000000000000',
    },
  })
  checkNeighborhoodTicksAndPrices(r3)
})
