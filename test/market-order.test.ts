import { afterEach, expect, test } from 'vitest'
import { getMarket, marketOrder, signERC20Permit } from '@clober/v2-sdk'
import { getAddress } from 'viem'

import { buildPublicClient } from '../src/constants/client'

import { cloberTestChain } from './utils/test-chain'
import { account, FORK_BLOCK_NUMBER, FORK_URL } from './utils/constants'
import { createProxyClients } from './utils/utils'
import { fetchTokenBalance } from './utils/currency'

const clients = createProxyClients(
  Array.from({ length: 6 }, () => Math.floor(new Date().getTime())).map(
    (id) => id,
  ),
)

afterEach(async () => {
  await Promise.all(
    clients.map(({ testClient }) => {
      return testClient.reset({
        jsonRpcUrl: FORK_URL,
        blockNumber: FORK_BLOCK_NUMBER,
      })
    }),
  )
})

test('market order in not open market', async () => {
  const { publicClient } = clients[0] as any
  buildPublicClient(cloberTestChain.id, publicClient.transport.url!)

  expect(
    (
      await marketOrder({
        chainId: cloberTestChain.id,
        userAddress: '0x447ad4a108b5540c220f9f7e83723ac87c0f8fd8',
        inputToken: '0x447ad4a108b5540c220f9f7e83723ac87c0f8fd8',
        outputToken: '0x447ad4a108b5540c220f9f7e83723ac87c0f8fd8',
        amountIn: '10',
        options: {
          rpcUrl: publicClient.transport.url!,
        },
      }).catch((e) => e.message)
    ).includes('Open the market before placing a market order.'),
  ).toEqual(true)
})

test('spend with token', async () => {
  const { publicClient, walletClient } = clients[1] as any
  buildPublicClient(cloberTestChain.id, publicClient.transport.url!)

  const erc20PermitParams = await signERC20Permit({
    chainId: cloberTestChain.id,
    walletClient,
    token: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    amount: '1000000',
    options: {
      rpcUrl: publicClient.transport.url!,
    },
  })
  const { transaction, result } = await marketOrder({
    chainId: cloberTestChain.id,
    userAddress: account.address,
    inputToken: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    outputToken: '0x0000000000000000000000000000000000000000',
    amountIn: '1000000',
    options: {
      erc20PermitParam: erc20PermitParams!,
      rpcUrl: publicClient.transport.url!,
    },
  })

  const [beforeUSDCBalance, beforeETHBalance] = await Promise.all([
    fetchTokenBalance(
      cloberTestChain.id,
      '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
      account.address,
    ),
    publicClient.getBalance({
      address: account.address,
    }),
  ])

  await walletClient.sendTransaction({
    ...transaction!,
    account,
    gasPrice: transaction!.gasPrice! * 2n,
  })

  const [afterUSDCBalance, afterETHBalance, afterMarket] = await Promise.all([
    fetchTokenBalance(
      cloberTestChain.id,
      '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
      account.address,
    ),
    publicClient.getBalance({
      address: account.address,
    }),
    getMarket({
      chainId: cloberTestChain.id,
      token0: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
      token1: '0x0000000000000000000000000000000000000000',
      options: {
        rpcUrl: publicClient.transport.url!,
      },
    }),
  ])

  expect(beforeUSDCBalance - afterUSDCBalance).toEqual(5181356442n)
  expect(Number(afterETHBalance)).toBeGreaterThan(Number(beforeETHBalance))
  expect(afterMarket.asks.length).toEqual(0)

  expect(result.spend.amount).toEqual('5181.356442')
  expect(result.spend.currency.address).toEqual(
    getAddress('0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0'),
  )
  expect(result.spend.direction).toEqual('in')

  expect(result.take.amount).toEqual('1.329068601')
  expect(result.take.currency.address).toEqual(
    getAddress('0x0000000000000000000000000000000000000000'),
  )
  expect(result.take.direction).toEqual('out')
})

test('spend with eth', async () => {
  const { publicClient, walletClient } = clients[2] as any
  buildPublicClient(cloberTestChain.id, publicClient.transport.url!)

  await publicClient.waitForTransactionReceipt({
    hash: await walletClient.sendTransaction({
      account: '0x5F79EE8f8fA862E98201120d83c4eC39D9468D49',
      to: account.address,
      value: 2000000000000000000n,
    }),
  })

  const { transaction, result } = await marketOrder({
    chainId: cloberTestChain.id,
    userAddress: account.address,
    inputToken: '0x0000000000000000000000000000000000000000',
    outputToken: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    amountIn: '1.001',
    options: {
      rpcUrl: publicClient.transport.url!,
    },
  })

  const [beforeUSDCBalance, beforeETHBalance] = await Promise.all([
    fetchTokenBalance(
      cloberTestChain.id,
      '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
      account.address,
    ),
    publicClient.getBalance({
      address: account.address,
    }),
  ])

  await walletClient.sendTransaction({
    ...transaction!,
    account,
    gasPrice: transaction!.gasPrice! * 2n,
  })

  const [afterUSDCBalance, afterETHBalance, afterMarket] = await Promise.all([
    fetchTokenBalance(
      cloberTestChain.id,
      '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
      account.address,
    ),
    publicClient.getBalance({
      address: account.address,
    }),
    getMarket({
      chainId: cloberTestChain.id,
      token0: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
      token1: '0x0000000000000000000000000000000000000000',
      options: {
        rpcUrl: publicClient.transport.url!,
      },
    }),
  ])

  expect(Number(beforeETHBalance)).toBeGreaterThan(Number(afterETHBalance))
  expect(afterUSDCBalance - beforeUSDCBalance).toEqual(3498370348n)
  expect(afterMarket.bids.length).toEqual(3)

  expect(result.spend.amount).toEqual('1.00099999997605376')
  expect(result.spend.currency.address).toEqual(
    getAddress('0x0000000000000000000000000000000000000000'),
  )
  expect(result.spend.direction).toEqual('in')

  expect(result.take.amount).toEqual('3498.370348')
  expect(result.take.currency.address).toEqual(
    getAddress('0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0'),
  )
  expect(result.take.direction).toEqual('out')
})

test('take with token', async () => {
  const { publicClient, walletClient } = clients[3] as any
  buildPublicClient(cloberTestChain.id, publicClient.transport.url!)

  const erc20PermitParams = await signERC20Permit({
    chainId: cloberTestChain.id,
    walletClient,
    token: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    amount: '1000000',
    options: {
      rpcUrl: publicClient.transport.url!,
    },
  })
  const { transaction, result } = await marketOrder({
    chainId: cloberTestChain.id,
    userAddress: account.address,
    inputToken: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    outputToken: '0x0000000000000000000000000000000000000000',
    amountOut: '1.001',
    options: {
      erc20PermitParam: erc20PermitParams!,
      rpcUrl: publicClient.transport.url!,
    },
  })

  const [beforeUSDCBalance, beforeETHBalance] = await Promise.all([
    fetchTokenBalance(
      cloberTestChain.id,
      '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
      account.address,
    ),
    publicClient.getBalance({
      address: account.address,
    }),
  ])

  await walletClient.sendTransaction({
    ...transaction!,
    account,
    gasPrice: transaction!.gasPrice! * 2n,
  })

  const [afterUSDCBalance, afterETHBalance, afterMarket] = await Promise.all([
    fetchTokenBalance(
      cloberTestChain.id,
      '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
      account.address,
    ),
    publicClient.getBalance({
      address: account.address,
    }),
    getMarket({
      chainId: cloberTestChain.id,
      token0: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
      token1: '0x0000000000000000000000000000000000000000',
      options: {
        rpcUrl: publicClient.transport.url!,
      },
    }),
  ])

  expect(beforeUSDCBalance - afterUSDCBalance).toEqual(3867722122n)
  expect(Number(afterETHBalance)).toBeGreaterThan(Number(beforeETHBalance))
  expect(afterMarket.asks.length).toEqual(1)

  expect(result.spend.amount).toEqual('3867.722122')
  expect(result.spend.currency.address).toEqual(
    getAddress('0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0'),
  )
  expect(result.spend.direction).toEqual('in')

  expect(result.take.amount).toEqual('1.001000997')
  expect(result.take.currency.address).toEqual(
    getAddress('0x0000000000000000000000000000000000000000'),
  )
  expect(result.take.direction).toEqual('out')
})

test('take with eth', async () => {
  const { publicClient, walletClient } = clients[3] as any
  buildPublicClient(cloberTestChain.id, publicClient.transport.url!)

  await publicClient.waitForTransactionReceipt({
    hash: await walletClient.sendTransaction({
      account: '0x5F79EE8f8fA862E98201120d83c4eC39D9468D49',
      to: account.address,
      value: 2000000000000000000n,
    }),
  })

  const { transaction, result } = await marketOrder({
    chainId: cloberTestChain.id,
    userAddress: account.address,
    inputToken: '0x0000000000000000000000000000000000000000',
    outputToken: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    amountOut: '1005',
    options: {
      rpcUrl: publicClient.transport.url!,
    },
  })

  const [beforeUSDCBalance, beforeETHBalance] = await Promise.all([
    fetchTokenBalance(
      cloberTestChain.id,
      '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
      account.address,
    ),
    publicClient.getBalance({
      address: account.address,
    }),
  ])

  await walletClient.sendTransaction({
    ...transaction!,
    account,
    gasPrice: transaction!.gasPrice! * 2n,
  })

  const [afterUSDCBalance, afterETHBalance, afterMarket] = await Promise.all([
    fetchTokenBalance(
      cloberTestChain.id,
      '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
      account.address,
    ),
    publicClient.getBalance({
      address: account.address,
    }),
    getMarket({
      chainId: cloberTestChain.id,
      token0: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
      token1: '0x0000000000000000000000000000000000000000',
      options: {
        rpcUrl: publicClient.transport.url!,
      },
    }),
  ])

  expect(afterUSDCBalance - beforeUSDCBalance).toEqual(1005000000n)
  expect(Number(beforeETHBalance)).toBeGreaterThan(Number(afterETHBalance))
  expect(afterMarket.bids.length).toEqual(4)

  expect(result.spend.amount).toEqual('0.287437077314383477')
  expect(result.spend.currency.address).toEqual(
    getAddress('0x0000000000000000000000000000000000000000'),
  )
  expect(result.spend.direction).toEqual('in')

  expect(result.take.amount).toEqual('1005')
  expect(result.take.currency.address).toEqual(
    getAddress('0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0'),
  )
  expect(result.take.direction).toEqual('out')
})

test('revert market order', async () => {
  const { publicClient } = clients[4] as any
  buildPublicClient(cloberTestChain.id, publicClient.transport.url!)

  expect(
    (
      await marketOrder({
        chainId: cloberTestChain.id,
        userAddress: account.address,
        inputToken: '0x0000000000000000000000000000000000000000',
        outputToken: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
        options: {
          rpcUrl: publicClient.transport.url!,
        },
      }).catch((e) => e.message)
    ).includes('Either amountIn or amountOut must be provided'),
  ).toEqual(true)

  expect(
    (
      await marketOrder({
        chainId: cloberTestChain.id,
        userAddress: account.address,
        inputToken: '0x0000000000000000000000000000000000000000',
        outputToken: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
        amountIn: '1',
        amountOut: '1',
        options: {
          rpcUrl: publicClient.transport.url!,
        },
      }).catch((e) => e.message)
    ).includes('Only one of amountIn or amountOut can be provided'),
  ).toEqual(true)
})
