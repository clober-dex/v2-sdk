import { expect, test } from 'vitest'
import {
  addLiquidity,
  adjustOrderPrice,
  getPool,
  setStrategyConfig,
} from '@clober/v2-sdk'
import { zeroHash } from 'viem'

import { setUp } from './setup'
import { waitForTransaction } from './utils/transaction'
import { DEV_WALLET, MOCK_USDC } from './constants'

test('Adjust order price', async () => {
  const { publicClient, walletClient, testClient, tokenAddress } =
    await setUp('adjust')

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

  const beforePool = await getPool({
    chainId: publicClient.chain.id,
    token0: MOCK_USDC,
    token1: tokenAddress,
    salt: zeroHash,
    options: {
      rpcUrl: publicClient.transport.url!,
      useSubgraph: false,
    },
  })

  await testClient.impersonateAccount({
    address: DEV_WALLET,
  })
  await setStrategyConfig({
    chainId: publicClient.chain.id,
    userAddress: DEV_WALLET,
    token0: MOCK_USDC,
    token1: tokenAddress,
    salt: zeroHash,
    config: {
      referenceThreshold: '0.1',
      rebalanceThreshold: '0.1',
      rateA: '0.1',
      rateB: '0.1',
      minRateA: '0.003',
      minRateB: '0.003',
      priceThresholdA: '0.1',
      priceThresholdB: '0.1',
    },
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

  const afterPool = await getPool({
    chainId: publicClient.chain.id,
    token0: MOCK_USDC,
    token1: tokenAddress,
    salt: zeroHash,
    options: {
      rpcUrl: publicClient.transport.url!,
      useSubgraph: false,
    },
  })

  expect(beforePool.liquidityA.total.value).toBe('2000')
  expect(beforePool.liquidityB.total.value).toBe('1')

  expect(beforePool.liquidityA.cancelable.value).toBe('0')
  expect(beforePool.liquidityB.cancelable.value).toBe('0')
  expect(beforePool.liquidityA.claimable.value).toBe('0')
  expect(beforePool.liquidityB.claimable.value).toBe('0')

  expect(afterPool.liquidityA.cancelable.value).toBe('99.999999')
  expect(afterPool.liquidityB.cancelable.value).toBe('0.0366699957')
  expect(afterPool.liquidityA.claimable.value).toBe('0')
  expect(afterPool.liquidityB.claimable.value).toBe('0')
})

test('Adjust order price with invalid alpha', async () => {})
