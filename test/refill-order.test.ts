import { expect, test } from 'vitest'
import {
  addLiquidity,
  adjustOrderPrice,
  getContractAddresses,
  getPool,
  marketOrder,
  refillOrder,
} from '@clober/v2-sdk'
import { zeroHash } from 'viem'

import { STRATEGY_ABI } from '../src/constants/abis/rebalancer/strategy-abi'

import { setUp } from './setup'
import { DEV_WALLET, MOCK_USDC } from './constants'
import { waitForTransaction } from './utils/transaction'

test('Refill order', async () => {
  const { publicClient, walletClient, tokenAddress } = await setUp('adjust')

  await addLiquidity({
    chainId: publicClient.chain.id,
    userAddress: walletClient.account!.address,
    token0: MOCK_USDC,
    token1: tokenAddress,
    salt: zeroHash,
    amount0: '2000',
    amount1: '1.0',
    options: {
      rpcUrl: publicClient.transport.url!,
      useSubgraph: false,
    },
  }).then(({ transaction }) =>
    waitForTransaction({
      transaction: transaction!,
      walletClient,
      publicClient,
    }),
  )

  const poolStep1 = await getPool({
    chainId: publicClient.chain.id,
    token0: MOCK_USDC,
    token1: tokenAddress,
    salt: zeroHash,
    options: {
      rpcUrl: publicClient.transport.url!,
      useSubgraph: false,
    },
  })

  await walletClient
    .writeContract({
      account: DEV_WALLET,
      address: getContractAddresses({ chainId: publicClient.chain.id })!
        .Strategy,
      abi: STRATEGY_ABI,
      functionName: 'setConfig',
      args: [
        poolStep1.key,
        {
          referenceThreshold: 10000,
          rebalanceThreshold: 50000,
          rateA: 1000000,
          rateB: 1000000,
          minRateA: 1000000,
          minRateB: 1000000,
          priceThresholdA: 10000,
          priceThresholdB: 10000,
        },
      ],
    })
    .then((hash) => publicClient.waitForTransactionReceipt({ hash }))

  await adjustOrderPrice({
    chainId: publicClient.chain.id,
    userAddress: DEV_WALLET,
    token0: MOCK_USDC,
    token1: tokenAddress,
    salt: zeroHash,
    oraclePrice: '2727',
    bidPrice: '2717',
    askPrice: '2737',
    alpha: '0.5',
    options: {
      rpcUrl: publicClient.transport.url!,
      useSubgraph: false,
    },
  }).then((transaction) =>
    waitForTransaction({
      transaction: transaction!,
      walletClient,
      publicClient,
    }),
  )

  await marketOrder({
    chainId: publicClient.chain.id,
    userAddress: walletClient.account!.address,
    inputToken: MOCK_USDC,
    outputToken: tokenAddress,
    amountIn: '100000',
    options: {
      rpcUrl: publicClient.transport.url!,
      useSubgraph: false,
    },
  }).then(({ transaction }) =>
    waitForTransaction({
      transaction: transaction!,
      walletClient,
      publicClient,
    }),
  )

  await marketOrder({
    chainId: publicClient.chain.id,
    userAddress: walletClient.account!.address,
    inputToken: tokenAddress,
    outputToken: MOCK_USDC,
    amountIn: '4',
    options: {
      rpcUrl: publicClient.transport.url!,
      useSubgraph: false,
    },
  }).then(({ transaction }) =>
    waitForTransaction({
      transaction: transaction!,
      walletClient,
      publicClient,
    }),
  )

  const poolStep2 = await getPool({
    chainId: publicClient.chain.id,
    token0: MOCK_USDC,
    token1: tokenAddress,
    salt: zeroHash,
    options: {
      rpcUrl: publicClient.transport.url!,
      useSubgraph: false,
    },
  })

  await refillOrder({
    chainId: publicClient.chain.id,
    userAddress: walletClient.account!.address,
    token0: MOCK_USDC,
    token1: tokenAddress,
    salt: zeroHash,
    options: {
      rpcUrl: publicClient.transport.url!,
      useSubgraph: false,
    },
  }).then((transaction) =>
    waitForTransaction({
      transaction: transaction!,
      walletClient,
      publicClient,
    }),
  )

  const poolStep3 = await getPool({
    chainId: publicClient.chain.id,
    token0: MOCK_USDC,
    token1: tokenAddress,
    salt: zeroHash,
    options: {
      rpcUrl: publicClient.transport.url!,
      useSubgraph: false,
    },
  })

  expect(poolStep1.liquidityA.total.value).toBe('2000')
  expect(poolStep1.liquidityB.total.value).toBe('1')
  expect(poolStep1.liquidityA.reserve.value).toBe('2000')
  expect(poolStep1.liquidityB.reserve.value).toBe('1')
  expect(poolStep1.liquidityA.cancelable.value).toBe('0')
  expect(poolStep1.liquidityB.cancelable.value).toBe('0')
  expect(poolStep1.liquidityA.claimable.value).toBe('0')
  expect(poolStep1.liquidityB.claimable.value).toBe('0')

  expect(poolStep2.liquidityA.total.value).toBe('2368.895781')
  expect(poolStep2.liquidityB.total.value).toBe('0.868191592684249129')
  expect(poolStep2.liquidityA.reserve.value).toBe('1000')
  expect(poolStep2.liquidityB.reserve.value).toBe('0.500000045')
  expect(poolStep2.liquidityA.cancelable.value).toBe('0')
  expect(poolStep2.liquidityB.cancelable.value).toBe('0')
  expect(poolStep2.liquidityA.claimable.value).toBe('1368.895781')
  expect(poolStep2.liquidityB.claimable.value).toBe('0.368191547684249129')

  expect(poolStep3.liquidityA.total.value).toBe('2368.89578')
  expect(poolStep3.liquidityB.total.value).toBe('0.868191592684249129')
  expect(poolStep3.liquidityA.reserve.value).toBe('1184.44789')
  expect(poolStep3.liquidityB.reserve.value).toBe('0.434095860484249129')
  expect(poolStep3.liquidityA.cancelable.value).toBe('1184.44789')
  expect(poolStep3.liquidityB.cancelable.value).toBe('0.4340957322')
  expect(poolStep3.liquidityA.claimable.value).toBe('0')
  expect(poolStep3.liquidityB.claimable.value).toBe('0')
})
