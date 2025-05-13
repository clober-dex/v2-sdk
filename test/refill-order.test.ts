import { beforeEach, expect, test } from 'vitest'
import {
  addLiquidity,
  adjustOrderPrice,
  approveERC20,
  getPool,
  marketOrder,
  openPool,
  refillOrder,
  setStrategyConfig,
} from '@clober/v2-sdk'
import { zeroHash } from 'viem'

import { cloberTestChain2 } from '../src/constants/chains/test-chain'
import { CONTRACT_ADDRESSES } from '../src/constants/addresses'

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
        blockNumber: 91501200n,
      })
    }),
  )
})

test('Refill order', async () => {
  const { publicClient, walletClient, testClient } = clients[0] as any

  await testClient.impersonateAccount({
    address: '0x5F79EE8f8fA862E98201120d83c4eC39D9468D49',
  })

  const openPoolTx = await openPool({
    chainId: cloberTestChain2.id,
    userAddress: '0x5F79EE8f8fA862E98201120d83c4eC39D9468D49',
    tokenA: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    tokenB: '0xF2e615A933825De4B39b497f6e6991418Fb31b78',
    salt: zeroHash,
    options: {
      rpcUrl: publicClient.transport.url!,
      useSubgraph: false,
    },
  })
  const openPoolHash = await walletClient.sendTransaction({
    ...openPoolTx!,
    account: '0x5F79EE8f8fA862E98201120d83c4eC39D9468D49',
    gasPrice: openPoolTx!.gasPrice! * 2n,
  })
  await publicClient.waitForTransactionReceipt({ hash: openPoolHash })

  const approveMintHash1 = await walletClient.writeContract({
    account: account,
    chain: cloberTestChain2,
    address: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    abi: [
      {
        inputs: [
          {
            internalType: 'address',
            name: 'spender',
            type: 'address',
          },
          {
            internalType: 'uint256',
            name: 'value',
            type: 'uint256',
          },
        ],
        name: 'approve',
        outputs: [
          {
            internalType: 'bool',
            name: '',
            type: 'bool',
          },
        ],
        stateMutability: 'nonpayable',
        type: 'function',
      },
    ] as const,
    functionName: 'approve',
    args: [CONTRACT_ADDRESSES[cloberTestChain2.id]!.Minter, 2n ** 256n - 1n],
  })
  const approveMintReceipt1 = await publicClient.waitForTransactionReceipt({
    hash: approveMintHash1!,
  })
  expect(approveMintReceipt1.status).toEqual('success')
  const approveMintHash2 = await walletClient.writeContract({
    account: account,
    chain: cloberTestChain2,
    address: '0xF2e615A933825De4B39b497f6e6991418Fb31b78',
    abi: [
      {
        inputs: [
          {
            internalType: 'address',
            name: 'spender',
            type: 'address',
          },
          {
            internalType: 'uint256',
            name: 'value',
            type: 'uint256',
          },
        ],
        name: 'approve',
        outputs: [
          {
            internalType: 'bool',
            name: '',
            type: 'bool',
          },
        ],
        stateMutability: 'nonpayable',
        type: 'function',
      },
    ] as const,
    functionName: 'approve',
    args: [CONTRACT_ADDRESSES[cloberTestChain2.id]!.Minter, 2n ** 256n - 1n],
  })
  const approveMintReceipt2 = await publicClient.waitForTransactionReceipt({
    hash: approveMintHash2!,
  })
  expect(approveMintReceipt2.status).toEqual('success')

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

  const transactionForSetConfig = await setStrategyConfig({
    chainId: cloberTestChain2.id,
    userAddress: '0x5F79EE8f8fA862E98201120d83c4eC39D9468D49',
    token0: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    token1: '0xF2e615A933825De4B39b497f6e6991418Fb31b78',
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
    oraclePrice: '2727',
    bidPrice: '2717',
    askPrice: '2737',
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

  const approveHash1 = await approveERC20({
    chainId: cloberTestChain2.id,
    walletClient,
    token: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    amount: '3000',
    options: {
      rpcUrl: publicClient.transport.url!,
    },
  })
  const approveReceipt1 = await publicClient.waitForTransactionReceipt({
    hash: approveHash1!,
  })
  expect(approveReceipt1.status).toEqual('success')
  const approveHash2 = await approveERC20({
    chainId: cloberTestChain2.id,
    walletClient,
    token: '0xF2e615A933825De4B39b497f6e6991418Fb31b78',
    amount: '3',
    options: {
      rpcUrl: publicClient.transport.url!,
    },
  })
  const approveReceipt2 = await publicClient.waitForTransactionReceipt({
    hash: approveHash2!,
  })
  expect(approveReceipt2.status).toEqual('success')

  const { transaction: tx3 } = await marketOrder({
    chainId: cloberTestChain2.id,
    userAddress: account.address,
    inputToken: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    outputToken: '0xF2e615A933825De4B39b497f6e6991418Fb31b78',
    amountIn: '100',
    options: {
      rpcUrl: publicClient.transport.url!,
      useSubgraph: false,
    },
  })
  const hash3 = await walletClient.sendTransaction({
    ...tx3!,
    account,
    gasPrice: tx1!.gasPrice! * 2n,
  })
  await publicClient.waitForTransactionReceipt({ hash: hash3 })
  const { transaction: tx4 } = await marketOrder({
    chainId: cloberTestChain2.id,
    userAddress: account.address,
    inputToken: '0xF2e615A933825De4B39b497f6e6991418Fb31b78',
    outputToken: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    amountIn: '0.5',
    options: {
      rpcUrl: publicClient.transport.url!,
      useSubgraph: false,
    },
  })
  const hash4 = await walletClient.sendTransaction({
    ...tx4!,
    account,
    gasPrice: tx1!.gasPrice! * 2n,
  })
  await publicClient.waitForTransactionReceipt({ hash: hash4 })

  const poolStep4 = await getPool({
    chainId: cloberTestChain2.id,
    token0: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    token1: '0xF2e615A933825De4B39b497f6e6991418Fb31b78',
    salt: zeroHash,
    options: {
      rpcUrl: publicClient.transport.url!,
      useSubgraph: false,
    },
  })

  const tx5 = await refillOrder({
    chainId: cloberTestChain2.id,
    userAddress: account.address,
    token0: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    token1: '0xF2e615A933825De4B39b497f6e6991418Fb31b78',
    salt: zeroHash,
    options: {
      rpcUrl: publicClient.transport.url!,
      useSubgraph: false,
    },
  })
  const hash5 = await walletClient.sendTransaction({
    ...tx5!,
    account,
    gasPrice: tx1!.gasPrice! * 2n,
  })
  await publicClient.waitForTransactionReceipt({ hash: hash5 })

  const poolStep5 = await getPool({
    chainId: cloberTestChain2.id,
    token0: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    token1: '0xF2e615A933825De4B39b497f6e6991418Fb31b78',
    salt: zeroHash,
    options: {
      rpcUrl: publicClient.transport.url!,
      useSubgraph: false,
    },
  })

  expect(poolStep4.liquidityA.cancelable.value).toBe('0')
  expect(poolStep4.liquidityB.cancelable.value).toBe('0.0001449565')
  expect(poolStep4.liquidityA.claimable.value).toBe('99.997953')
  expect(poolStep4.liquidityB.claimable.value).toBe('0.036819154768424912')

  expect(poolStep5.liquidityA.cancelable.value).toBe('99.999897')
  expect(poolStep5.liquidityB.cancelable.value).toBe('0.0366699957')
  expect(poolStep5.liquidityA.claimable.value).toBe('0')
  expect(poolStep5.liquidityB.claimable.value).toBe('0')
})
