import { createPublicClient, http } from 'viem'
import { arbitrumSepolia } from 'viem/chains'
import { expect, test } from 'vitest'

import { FeePolicy } from '../src/model/fee-policy'
import {
  MAKER_DEFAULT_POLICY,
  TAKER_DEFAULT_POLICY,
} from '../src/constants/fee'

import { FEE_POLICY_WRAPPER_ADDRESS } from './utils/addresses'

const _abi = [
  {
    inputs: [],
    name: 'InvalidFeePolicy',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'FeePolicy',
        name: 'self',
        type: 'uint24',
      },
      {
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
      {
        internalType: 'bool',
        name: 'reverseRounding',
        type: 'bool',
      },
    ],
    name: 'calculateFee',
    outputs: [
      {
        internalType: 'int256',
        name: 'fee',
        type: 'int256',
      },
    ],
    stateMutability: 'pure',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'FeePolicy',
        name: 'self',
        type: 'uint24',
      },
      {
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
      {
        internalType: 'bool',
        name: 'reverseFee',
        type: 'bool',
      },
    ],
    name: 'calculateOriginalAmount',
    outputs: [
      {
        internalType: 'uint256',
        name: 'originalAmount',
        type: 'uint256',
      },
    ],
    stateMutability: 'pure',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'bool',
        name: 'usesQuote_',
        type: 'bool',
      },
      {
        internalType: 'int24',
        name: 'rate_',
        type: 'int24',
      },
    ],
    name: 'encode',
    outputs: [
      {
        internalType: 'FeePolicy',
        name: 'feePolicy',
        type: 'uint24',
      },
    ],
    stateMutability: 'pure',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'FeePolicy',
        name: 'self',
        type: 'uint24',
      },
    ],
    name: 'usesQuote',
    outputs: [
      {
        internalType: 'bool',
        name: 'f',
        type: 'bool',
      },
    ],
    stateMutability: 'pure',
    type: 'function',
  },
] as const

const publicClient = createPublicClient({
  chain: arbitrumSepolia,
  transport: http(),
})

const encode = async (usesQuote: boolean, rate: number) => {
  const mockPolicy = new FeePolicy(usesQuote, BigInt(rate))
  const policy = await publicClient.readContract({
    address: FEE_POLICY_WRAPPER_ADDRESS,
    abi: _abi,
    functionName: 'encode',
    args: [usesQuote, rate],
  })
  expect(policy).toEqual(Number(mockPolicy.value))
  expect(
    await publicClient.readContract({
      address: FEE_POLICY_WRAPPER_ADDRESS,
      abi: _abi,
      functionName: 'usesQuote',
      args: [policy],
    }),
  ).toEqual(mockPolicy.usesQuote)
}

const checkCalculateFee = async (
  policy: FeePolicy,
  amount: bigint,
  reverseRounding: boolean,
) => {
  expect(
    await publicClient.readContract({
      address: FEE_POLICY_WRAPPER_ADDRESS,
      abi: _abi,
      functionName: 'calculateFee',
      args: [Number(policy.value), amount, reverseRounding],
    }),
  ).toEqual(policy.calculateFee(amount, reverseRounding))
}

const checkCalculateOriginalAmount = async (
  policy: FeePolicy,
  amount: bigint,
  reverseFee: boolean,
) => {
  expect(
    await publicClient.readContract({
      address: FEE_POLICY_WRAPPER_ADDRESS,
      abi: _abi,
      functionName: 'calculateOriginalAmount',
      args: [Number(policy.value), amount, reverseFee],
    }),
  ).toEqual(policy.calculateOriginalAmount(amount, reverseFee))
}

const checkFrom = async (policy: FeePolicy) => {
  const _feePolicy = FeePolicy.from(policy.value)
  expect(policy.usesQuote).toEqual(_feePolicy.usesQuote)
  expect(policy.value).toEqual(_feePolicy.value)
}

test('check encode function', async () => {
  await encode(true, 0)
  await encode(true, 1)
  await encode(true, Number(MAKER_DEFAULT_POLICY.rate))
  await encode(true, Number(TAKER_DEFAULT_POLICY.rate))
  await encode(true, 500000)
  await encode(true, -500000)
  await encode(false, 0)
  await encode(false, 1)
  await encode(false, 500000)
  await encode(false, -500000)
  await encode(false, Number(MAKER_DEFAULT_POLICY.rate))
  await encode(false, Number(TAKER_DEFAULT_POLICY.rate))
})

test('check calculateFee function', async () => {
  await checkCalculateFee(new FeePolicy(true, 0n), 1000000n, false)
  await checkCalculateFee(new FeePolicy(true, 1n), 1000000n, false)
  await checkCalculateFee(MAKER_DEFAULT_POLICY, 1000000n, false)
  await checkCalculateFee(TAKER_DEFAULT_POLICY, 1000000n, false)
  await checkCalculateFee(new FeePolicy(true, 500000n), 1000000n, false)
  await checkCalculateFee(new FeePolicy(true, -500000n), 1000000n, false)
})

test('check calculateOriginalAmount function', async () => {
  await checkCalculateOriginalAmount(new FeePolicy(true, 0n), 1000000n, false)
  await checkCalculateOriginalAmount(new FeePolicy(true, 1n), 1000000n, false)
  await checkCalculateOriginalAmount(MAKER_DEFAULT_POLICY, 1000000n, false)
  await checkCalculateOriginalAmount(TAKER_DEFAULT_POLICY, 1000000n, false)
  await checkCalculateOriginalAmount(
    new FeePolicy(true, 500000n),
    1000000n,
    false,
  )
  await checkCalculateOriginalAmount(
    new FeePolicy(true, -500000n),
    1000000n,
    false,
  )
})

test('check static object', async () => {
  checkFrom(new FeePolicy(true, 0n))
  checkFrom(new FeePolicy(true, 1n))
  checkFrom(MAKER_DEFAULT_POLICY)
  checkFrom(TAKER_DEFAULT_POLICY)

  checkFrom(new FeePolicy(false, 0n))
  checkFrom(new FeePolicy(false, 1n))
  checkFrom(MAKER_DEFAULT_POLICY)
  checkFrom(TAKER_DEFAULT_POLICY)
})
