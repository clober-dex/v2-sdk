import { beforeEach, expect, test } from 'vitest'
import {
  addLiquidity,
  adjustOrderPrice,
  getPool,
  setStrategyConfig,
} from '@clober/v2-sdk'
import { zeroHash } from 'viem'
import BigNumber from 'bignumber.js'

import { cloberTestChain2 } from '../src/constants/test-chain'

import { account, FORK_URL } from './utils/constants'
import { createProxyClients2 } from './utils/utils'

const clients = createProxyClients2(
  Array.from({ length: 2 }, () => Math.floor(new Date().getTime())).map(
    (id) => id,
  ),
)

beforeEach(async () => {
  await Promise.all(
    clients.map(({ testClient }) => {
      return testClient.reset({
        jsonRpcUrl: FORK_URL,
        blockNumber: 84239911n,
      })
    }),
  )
})

test('Adjust order price', async () => {
  const { publicClient, walletClient, testClient } = clients[0] as any

  const poolStep1 = await getPool({
    chainId: cloberTestChain2.id,
    token0: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    token1: '0xF2e615A933825De4B39b497f6e6991418Fb31b78',
    salt: zeroHash,
    options: {
      rpcUrl: publicClient.transport.url!,
      useSubgraph: false,
    },
  })

  // Add liquidity to the pool
  const { transaction: tx1 } = await addLiquidity({
    chainId: cloberTestChain2.id,
    userAddress: account.address,
    token0: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    token1: '0xF2e615A933825De4B39b497f6e6991418Fb31b78',
    salt: zeroHash,
    amount0: '2000',
    amount1: '1.0',
    options: {
      rpcUrl: publicClient.transport.url!,
      useSubgraph: false,
    },
  })
  const hash1 = await walletClient.sendTransaction({
    ...tx1!,
    account,
    gasPrice: tx1!.gasPrice! * 2n,
  })
  await publicClient.waitForTransactionReceipt({ hash: hash1 })

  const poolStep2 = await getPool({
    chainId: cloberTestChain2.id,
    token0: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    token1: '0xF2e615A933825De4B39b497f6e6991418Fb31b78',
    salt: zeroHash,
    options: {
      rpcUrl: publicClient.transport.url!,
      useSubgraph: false,
    },
  })

  await testClient.impersonateAccount({
    address: '0x5F79EE8f8fA862E98201120d83c4eC39D9468D49',
  })
  const transactionForSetConfig = await setStrategyConfig({
    chainId: cloberTestChain2.id,
    userAddress: '0x5F79EE8f8fA862E98201120d83c4eC39D9468D49',
    token0: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    token1: '0xF2e615A933825De4B39b497f6e6991418Fb31b78',
    salt: zeroHash,
    config: {
      referenceThreshold: '0.1',
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
  })
  const hashForSetConfig = await walletClient.sendTransaction({
    ...transactionForSetConfig!,
    account: '0x5F79EE8f8fA862E98201120d83c4eC39D9468D49',
    gasPrice: transactionForSetConfig!.gasPrice! * 2n,
  })
  await publicClient.waitForTransactionReceipt({ hash: hashForSetConfig })
  const adjustOrderPriceTx = await adjustOrderPrice({
    chainId: cloberTestChain2.id,
    userAddress: '0x5F79EE8f8fA862E98201120d83c4eC39D9468D49',
    token0: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    token1: '0xF2e615A933825De4B39b497f6e6991418Fb31b78',
    salt: zeroHash,
    oraclePrice: '2620',
    bidPrice: '2610',
    askPrice: '2630',
    alpha: '0.5',
    options: {
      rpcUrl: publicClient.transport.url!,
      useSubgraph: false,
    },
  })
  const hash2 = await walletClient.sendTransaction({
    ...adjustOrderPriceTx!,
    account: '0x5F79EE8f8fA862E98201120d83c4eC39D9468D49',
    gasPrice: adjustOrderPriceTx!.gasPrice! * 2n,
  })
  await publicClient.waitForTransactionReceipt({ hash: hash2 })

  const poolStep3 = await getPool({
    chainId: cloberTestChain2.id,
    token0: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    token1: '0xF2e615A933825De4B39b497f6e6991418Fb31b78',
    salt: zeroHash,
    options: {
      rpcUrl: publicClient.transport.url!,
      useSubgraph: false,
    },
  })

  expect(
    BigNumber(poolStep1.liquidityA.total.value).plus('2000').toString(),
  ).toBe(poolStep2.liquidityA.total.value)
  expect(BigNumber(poolStep1.liquidityB.total.value).plus('1').toString()).toBe(
    poolStep2.liquidityB.total.value,
  )
  expect(poolStep1.liquidityA.cancelable.value).toBe('0')
  expect(poolStep1.liquidityB.cancelable.value).toBe('0')
  expect(poolStep1.liquidityA.claimable.value).toBe('0')
  expect(poolStep1.liquidityB.claimable.value).toBe('0')

  expect(poolStep2.liquidityA.cancelable.value).toBe('0')
  expect(poolStep2.liquidityB.cancelable.value).toBe('0')
  expect(poolStep2.liquidityA.claimable.value).toBe('0')
  expect(poolStep2.liquidityB.claimable.value).toBe('0')

  expect(poolStep3.liquidityA.cancelable.value).toBe('99.999999')
  expect(poolStep3.liquidityB.cancelable.value).toBe('0.0381675463')
  expect(poolStep3.liquidityA.claimable.value).toBe('0')
  expect(poolStep3.liquidityB.claimable.value).toBe('0')
})

test('Adjust order price with invalid alpha', async () => {
  const { publicClient } = clients[0] as any

  await expect(
    adjustOrderPrice({
      chainId: cloberTestChain2.id,
      userAddress: account.address,
      token0: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
      token1: '0xF2e615A933825De4B39b497f6e6991418Fb31b78',
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
