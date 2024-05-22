import { expect, test } from 'vitest'
import { createPublicClient, getAddress, http } from 'viem'
import { arbitrumSepolia } from 'viem/chains'
import {
  fromPrice,
  toPrice,
  baseToQuote,
  quoteToBase,
  getPriceNeighborhood,
} from '@clober/v2-sdk'

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
  expect(r1).toEqual({
    normal: {
      up: {
        tick: -196223n,
        price:
          '3010.020491496175336854662856393625997864163935761883106323466563480906188488006591796875',
      },
      now: {
        tick: -196224n,
        price:
          '3009.7195195442209147705821580251756869830060021897555344594366033561527729034423828125',
      },
      down: {
        tick: -196225n,
        price:
          '3009.4185776864522695398567861308819855451390963552160684457703609950840473175048828125',
      },
    },
    inverted: {
      up: {
        tick: 196224n,
        price:
          '0.0003322568742722696413308974229850890677541894347476040257943823109584857711240601929603144526481628',
      },
      now: {
        tick: 196223n,
        price:
          '0.0003322236519070789334383700227515392433492147500367813452455526858353440644577858620323240756988525',
      },
      down: {
        tick: 196222n,
        price:
          '0.0003321904328637925541824184172146056009640299088618136035843845599649371003181386186042800545692444',
      },
    },
  })

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
  expect(r2).toEqual({
    normal: {
      up: {
        tick: -276314n,
        price:
          '1.001003096595992654732739455761245056674324689638400087687841732986271381378173828125',
      },
      now: {
        tick: -276315n,
        price:
          '1.000903006295363124442143847471613613103985467034373613159914384596049785614013671875',
      },
      down: {
        tick: -276316n,
        price:
          '1.000802926002762845836415878361472329627552581288174593510120757855474948883056640625',
      },
    },
    inverted: {
      up: {
        tick: 276315n,
        price:
          '0.9990978083893409244999568991572440087045097389590493343394529804401063555197026744281174615025520325',
      },
      now: {
        tick: 276314n,
        price:
          '0.9989979085984810824021034351299395150109192433380980157013661284827812925080081640771823003888130188',
      },
      down: {
        tick: 276313n,
        price:
          '0.9988980187966014211881304391651285828713987371482077709055538564716231197948559383803512901067733765',
      },
    },
  })

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
  expect(r3).toEqual({
    normal: {
      up: {
        tick: -412662n,
        price:
          '0.0000012000879506814453803536784088542015321021683149638192844577133655548095703125',
      },
      now: {
        tick: -412663n,
        price:
          '0.000001199967953893708591363910009175222106357627804840149110532365739345550537109375',
      },
      down: {
        tick: -412664n,
        price:
          '0.00000119984796909665756173352105175451687291143798574921675026416778564453125',
      },
    },
    inverted: {
      up: {
        tick: 412663n,
        price:
          '833355.5881681308127343106641374173931113595915218107298924059104733102175399661604160428396426141262054443',
      },
      now: {
        tick: 412662n,
        price:
          '833272.2609473501231310283783415438606838878037965861773600064207542114811874678359515655756695196032524109',
      },
      down: {
        tick: 412661n,
        price:
          '833188.9420559381610215021453280266036196381924711226788431418461114733812339361307408580614719539880752563',
      },
    },
  })
})
