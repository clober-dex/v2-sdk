import { createPublicClient, http } from 'viem'
import { arbitrumSepolia } from 'viem/chains'
import { FeePolicy } from '@clober-dex/v2-sdk'
import { expect, test } from 'vitest'

import { FEE_POLICY_WRAPPER_ABI } from './abis/mock/fee-policy-wrapper-abi'

const MAKER_DEFAULT_POLICY = new FeePolicy(true, -300n) // -0.03%
const TAKER_DEFAULT_POLICY = new FeePolicy(true, 1000n) // 0.1%
const FEE_POLICY_WRAPPER_ADDRESS = '0xDCFA7E8Ad03D50EdF29e49bEBA7e5ae118B49A62'
const publicClient = createPublicClient({
  chain: arbitrumSepolia,
  transport: http(),
})

const encode = async (usesQuote: boolean, rate: number) => {
  const mockPolicy = new FeePolicy(usesQuote, BigInt(rate))
  const policy = await publicClient.readContract({
    address: FEE_POLICY_WRAPPER_ADDRESS,
    abi: FEE_POLICY_WRAPPER_ABI,
    functionName: 'encode',
    args: [usesQuote, rate],
  })
  expect(policy).toEqual(Number(mockPolicy.value))
  expect(
    await publicClient.readContract({
      address: FEE_POLICY_WRAPPER_ADDRESS,
      abi: FEE_POLICY_WRAPPER_ABI,
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
      abi: FEE_POLICY_WRAPPER_ABI,
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
      abi: FEE_POLICY_WRAPPER_ABI,
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

test('encode', async () => {
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

test('calculate fee', async () => {
  await checkCalculateFee(new FeePolicy(true, 0n), 1000000n, false)
  await checkCalculateFee(new FeePolicy(true, 1n), 1000000n, false)
  await checkCalculateFee(MAKER_DEFAULT_POLICY, 1000000n, false)
  await checkCalculateFee(TAKER_DEFAULT_POLICY, 1000000n, false)
  await checkCalculateFee(new FeePolicy(true, 500000n), 1000000n, false)
  await checkCalculateFee(new FeePolicy(true, -500000n), 1000000n, false)
})

test('calculate original amount', async () => {
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

test('from value', async () => {
  checkFrom(new FeePolicy(true, 0n))
  checkFrom(new FeePolicy(true, 1n))
  checkFrom(MAKER_DEFAULT_POLICY)
  checkFrom(TAKER_DEFAULT_POLICY)

  checkFrom(new FeePolicy(false, 0n))
  checkFrom(new FeePolicy(false, 1n))
  checkFrom(MAKER_DEFAULT_POLICY)
  checkFrom(TAKER_DEFAULT_POLICY)
})
