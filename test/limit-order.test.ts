import { expect, test, afterEach } from 'vitest'
import { getMarket, limitOrder, signERC20Permit } from '@clober/v2-sdk'
import { arbitrumSepolia } from 'viem/chains'
import { getAddress } from 'viem'

import { buildPublicClient } from '../src/constants/client'

import { fetchTokenBalance } from './utils/currency'
import { getSize } from './utils/depth'
import { account, FORK_BLOCK_NUMBER, FORK_URL } from './utils/constants'
import { cloberTestChain } from './utils/test-chain'
import { createProxyClients } from './utils/utils'

const clients = createProxyClients(
  Array.from({ length: 5 }, () => Math.floor(new Date().getTime())).map(
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

test('limit order in not open market', async () => {
  const { publicClient } = clients[0] as any
  buildPublicClient(cloberTestChain.id, publicClient.transport.url!)

  expect(
    (
      await limitOrder({
        chainId: arbitrumSepolia.id,
        userAddress: '0x447ad4a108b5540c220f9f7e83723ac87c0f8fd8',
        inputToken: '0x447ad4a108b5540c220f9f7e83723ac87c0f8fd8',
        outputToken: '0x0000000000000000000000000000000000000000',
        amount: '10',
        price: '1000',
      }).catch((e) => e.message)
    ).includes('Open the market before placing a limit order.'),
  ).toEqual(true)
})

test('make bid order', async () => {
  const { publicClient, walletClient } = clients[1] as any
  buildPublicClient(cloberTestChain.id, publicClient.transport.url!)

  const erc20PermitParams = await signERC20Permit({
    chainId: cloberTestChain.id,
    walletClient,
    token: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    amount: '1',
    options: {
      rpcUrl: publicClient.transport.url!,
      useSubgraph: false,
    },
  })
  const {
    transaction,
    result: { make, taken, spent },
  } = await limitOrder({
    chainId: cloberTestChain.id,
    userAddress: account.address,
    inputToken: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    outputToken: '0x0000000000000000000000000000000000000000',
    amount: '1',
    price: '0.01',
    options: {
      erc20PermitParam: erc20PermitParams!,
      rpcUrl: publicClient.transport.url!,
      postOnly: true,
      useSubgraph: false,
    },
  })

  const [beforeBalance, beforeMarket] = await Promise.all([
    fetchTokenBalance(
      cloberTestChain.id,
      '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
      account.address,
    ),
    getMarket({
      chainId: cloberTestChain.id,
      token0: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
      token1: '0x0000000000000000000000000000000000000000',
      options: {
        rpcUrl: publicClient.transport.url!,
        useSubgraph: false,
      },
    }),
  ])

  const hash = await walletClient.sendTransaction({
    ...transaction!,
    account,
    gasPrice: transaction!.gasPrice! * 2n,
  })
  const receipt = await publicClient.waitForTransactionReceipt({ hash })
  expect(receipt.status).toEqual('success')

  const [afterBalance, afterMarket] = await Promise.all([
    fetchTokenBalance(
      cloberTestChain.id,
      '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
      account.address,
    ),
    getMarket({
      chainId: cloberTestChain.id,
      token0: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
      token1: '0x0000000000000000000000000000000000000000',
      options: {
        rpcUrl: publicClient.transport.url!,
        useSubgraph: false,
      },
    }),
  ])

  expect(beforeBalance - afterBalance).toEqual(1000000n)
  expect(
    getSize(afterMarket.bids, 0, 0.01) - getSize(beforeMarket.bids, 0, 0.01),
  ).toEqual(100039694430551600000)
  expect(make.amount).toEqual('1')
  expect(make.currency.address).toEqual(
    getAddress('0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0'),
  )
  expect(spent.amount).toEqual('0')
  expect(spent.currency.address).toEqual(
    getAddress('0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0'),
  )
  expect(taken.amount).toEqual('0')
  expect(taken.currency.address).toEqual(
    '0x0000000000000000000000000000000000000000',
  )
})

test('make ask order', async () => {
  const { publicClient, walletClient } = clients[2] as any
  buildPublicClient(cloberTestChain.id, publicClient.transport.url!)

  const {
    transaction,
    result: { make, taken, spent },
  } = await limitOrder({
    chainId: cloberTestChain.id,
    userAddress: account.address,
    inputToken: '0x0000000000000000000000000000000000000000',
    outputToken: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    amount: '0.15',
    price: '8000.01',
    options: {
      rpcUrl: publicClient.transport.url!,
      postOnly: true,
      useSubgraph: false,
    },
  })

  const [beforeBalance, beforeMarket] = await Promise.all([
    publicClient.getBalance({
      address: account.address,
    }),
    getMarket({
      chainId: cloberTestChain.id,
      token0: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
      token1: '0x0000000000000000000000000000000000000000',
      options: {
        rpcUrl: publicClient.transport.url!,
        useSubgraph: false,
      },
    }),
  ])

  const hash = await walletClient.sendTransaction({
    ...transaction!,
    account,
    gasPrice: transaction!.gasPrice! * 2n,
  })
  const receipt = await publicClient.waitForTransactionReceipt({ hash })
  expect(receipt.status).toEqual('success')

  const [afterBalance, afterMarket] = await Promise.all([
    publicClient.getBalance({
      address: account.address,
    }),
    getMarket({
      chainId: cloberTestChain.id,
      token0: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
      token1: '0x0000000000000000000000000000000000000000',
      options: {
        rpcUrl: publicClient.transport.url!,
        useSubgraph: false,
      },
    }),
  ])

  expect(Number(beforeBalance - afterBalance)).greaterThan(150000000000000000)
  expect(
    getSize(afterMarket.asks, 8000, 8001) -
      getSize(beforeMarket.asks, 8000, 8001),
  ).toEqual(150045000000000000)
  expect(make.amount).toEqual('0.15')
  expect(make.currency.address).toEqual(
    '0x0000000000000000000000000000000000000000',
  )
  expect(spent.amount).toEqual('0')
  expect(spent.currency.address).toEqual(
    '0x0000000000000000000000000000000000000000',
  )
  expect(taken.amount).toEqual('0')
  expect(taken.currency.address).toEqual(
    getAddress('0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0'),
  )
})

test('limit bid order', async () => {
  const { publicClient, walletClient } = clients[3] as any
  buildPublicClient(cloberTestChain.id, publicClient.transport.url!)

  const [beforeUSDCBalance, beforeETHBalance, beforeMarket] = await Promise.all(
    [
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
          useSubgraph: false,
        },
      }),
    ],
  )
  const erc20PermitParams = await signERC20Permit({
    chainId: cloberTestChain.id,
    walletClient,
    token: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    amount: '100000',
    options: {
      rpcUrl: publicClient.transport.url!,
      useSubgraph: false,
    },
  })
  const {
    transaction,
    result: { make, taken, spent },
  } = await limitOrder({
    chainId: cloberTestChain.id,
    userAddress: account.address,
    inputToken: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    outputToken: '0x0000000000000000000000000000000000000000',
    amount: '100000',
    price: '3505.01',
    options: {
      erc20PermitParam: erc20PermitParams!,
      rpcUrl: publicClient.transport.url!,
      useSubgraph: false,
    },
  })

  const hash = await walletClient.sendTransaction({
    ...transaction!,
    account,
    gasPrice: transaction!.gasPrice! * 2n,
  })
  const receipt = await publicClient.waitForTransactionReceipt({ hash })
  expect(receipt.status).toEqual('success')

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
        useSubgraph: false,
      },
    }),
  ])

  expect(beforeUSDCBalance - afterUSDCBalance).toEqual(100000000000n)
  expect(Number(afterETHBalance - beforeETHBalance)).lessThan(
    100000000000000000,
  )
  expect(
    getSize(afterMarket.bids, 3504, 3505) -
      getSize(beforeMarket.bids, 3504, 3505),
  ).toEqual(28440764694968336000)
  expect(afterMarket.asks.length).toEqual(beforeMarket.asks.length - 1)
  expect(afterMarket.bids.length).toEqual(beforeMarket.bids.length + 1)
  expect(make.amount).toEqual('99649.86826')
  expect(make.currency.address).toEqual(
    getAddress('0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0'),
  )
  expect(taken.amount).toEqual('0.09992997')
  expect(taken.currency.address).toEqual(
    '0x0000000000000000000000000000000000000000',
  )
  expect(Number(make.amount) + Number(spent.amount)).toEqual(100000)
})

test('limit ask order', async () => {
  const { publicClient, walletClient } = clients[4] as any
  buildPublicClient(cloberTestChain.id, publicClient.transport.url!)

  await publicClient.waitForTransactionReceipt({
    hash: await walletClient.sendTransaction({
      account: '0x5F79EE8f8fA862E98201120d83c4eC39D9468D49',
      to: account.address,
      value: 2000000000000000000n,
    }),
  })

  const {
    transaction,
    result: { make, taken, spent },
  } = await limitOrder({
    chainId: cloberTestChain.id,
    userAddress: account.address,
    inputToken: '0x0000000000000000000000000000000000000000',
    outputToken: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    amount: '2',
    price: '3450.01',
    options: {
      rpcUrl: publicClient.transport.url!,
      useSubgraph: false,
    },
  })

  const [beforeUSDCBalance, beforeETHBalance, beforeMarket] = await Promise.all(
    [
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
          useSubgraph: false,
        },
      }),
    ],
  )

  const hash = await walletClient.sendTransaction({
    ...transaction!,
    account,
    gasPrice: transaction!.gasPrice! * 2n,
  })
  const receipt = await publicClient.waitForTransactionReceipt({ hash })
  expect(receipt.status).toEqual('success')

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
        useSubgraph: false,
      },
    }),
  ])

  expect(Number(beforeETHBalance - afterETHBalance)).greaterThan(
    2000000000000000000,
  )
  expect(afterUSDCBalance - beforeUSDCBalance).toEqual(3467570270n)
  expect(
    getSize(afterMarket.asks, 3450, 3451) -
      getSize(beforeMarket.asks, 3450, 3451),
  ).toEqual(1008553000000000000)
  expect(afterMarket.bids.length).toEqual(beforeMarket.bids.length - 1)
  expect(afterMarket.asks.length).toEqual(beforeMarket.asks.length + 1)
  expect(make.amount).toEqual('1.008250484573137286')
  expect(make.currency.address).toEqual(
    '0x0000000000000000000000000000000000000000',
  )
  expect(taken.amount).toEqual('3467.57027')
  expect(taken.currency.address).toEqual(
    getAddress('0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0'),
  )
  expect(Number(make.amount) + Number(spent.amount)).toEqual(2)
})
