import { expect, test } from 'vitest'
import {
  addLiquidity,
  adjustOrderPrice,
  getLastAmounts,
  getStrategyPrice,
  getContractAddresses,
  getPool,
} from '@clober/v2-sdk'
import { zeroHash } from 'viem'

import { STRATEGY_ABI } from '../../src/constants/abis/rebalancer/strategy-abi'
import { setUp } from '../setup'
import { waitForTransaction } from '../utils/transaction'
import { DEV_WALLET, MOCK_USDC } from '../utils/constants'

test('Adjust order price', async () => {
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

  await walletClient
    .writeContract({
      account: DEV_WALLET,
      address: getContractAddresses({ chainId: publicClient.chain.id })!
        .Strategy,
      abi: STRATEGY_ABI,
      functionName: 'setConfig',
      args: [
        beforePool.key,
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

  const [afterPool, strategyPrice, lastAmounts] = await Promise.all([
    getPool({
      chainId: publicClient.chain.id,
      token0: MOCK_USDC,
      token1: tokenAddress,
      salt: zeroHash,
      options: {
        rpcUrl: publicClient.transport.url!,
        useSubgraph: false,
      },
    }),
    getStrategyPrice({
      chainId: publicClient.chain.id,
      poolKey: beforePool.key,
      options: {
        rpcUrl: publicClient.transport.url!,
      },
    }),
    getLastAmounts({
      chainId: publicClient.chain.id,
      poolKey: beforePool.key,
      options: {
        rpcUrl: publicClient.transport.url!,
      },
    }),
  ])

  expect(strategyPrice).toBe({
    oraclePrice: 272700000000n,
    rate: '0.5',
    bidTick: -197248n,
    askTick: 197174n,
  })
  expect(lastAmounts.lastAmountA).toBe(1000000000n)
  expect(lastAmounts.lastAmountB).toBe(499999955000000000n)

  expect(beforePool.liquidityA.total.value).toBe('2000')
  expect(beforePool.liquidityB.total.value).toBe('1')
  expect(beforePool.liquidityA.cancelable.value).toBe('0')
  expect(beforePool.liquidityB.cancelable.value).toBe('0')
  expect(beforePool.liquidityA.claimable.value).toBe('0')
  expect(beforePool.liquidityB.claimable.value).toBe('0')

  expect(afterPool.liquidityA.total.value).toBe('1999.999999')
  expect(afterPool.liquidityB.total.value).toBe('1')

  expect(afterPool.liquidityA.reserve.value).toBe('1000')
  expect(afterPool.liquidityB.reserve.value).toBe('0.500000045')

  expect(afterPool.liquidityA.cancelable.value).toBe('999.999999')
  expect(afterPool.liquidityB.cancelable.value).toBe('0.499999955')

  expect(afterPool.liquidityA.claimable.value).toBe('0')
  expect(afterPool.liquidityB.claimable.value).toBe('0')
})

test('Adjust order price with invalid alpha', async () => {
  const { publicClient, walletClient, tokenAddress } = await setUp('adjust')

  await expect(
    adjustOrderPrice({
      chainId: publicClient.chain.id,
      userAddress: walletClient.account!.address,
      token0: MOCK_USDC,
      token1: tokenAddress,
      salt: zeroHash,
      oraclePrice: '2620',
      bidPrice: '2600',
      askPrice: '2650',
      alpha: '1.1', // Invalid alpha value
      options: {
        rpcUrl: publicClient.transport.url!,
        useSubgraph: false,
      },
    }),
  ).rejects.toThrow('Alpha value must be in the range (0, 1]')
})
