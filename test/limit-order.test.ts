import { expect, test, afterEach } from 'vitest'
import { getMarket, limitOrder, signERC20Permit } from '@clober/v2-sdk'
import { arbitrumSepolia } from 'viem/chains'

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
    await limitOrder({
      chainId: arbitrumSepolia.id,
      userAddress: '0x447ad4a108b5540c220f9f7e83723ac87c0f8fd8',
      inputToken: '0x447ad4a108b5540c220f9f7e83723ac87c0f8fd8',
      outputToken: '0x0000000000000000000000000000000000000000',
      amount: '10',
      price: '1000',
    }).catch((e) => e.message),
  ).toEqual(`
       import { openMarket } from '@clober/v2-sdk'

       const transaction = await openMarket(
            ${cloberTestChain.id},
           '0x447ad4a108b5540c220f9f7e83723ac87c0f8fd8',
           '0x0000000000000000000000000000000000000000',
       )
    `)
})

test('make bid order', async () => {
  const { publicClient, walletClient } = clients[1] as any
  buildPublicClient(cloberTestChain.id, publicClient.transport.url!)

  const signature = await signERC20Permit({
    chainId: cloberTestChain.id,
    account,
    token: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    amount: '1',
    options: {
      rpcUrl: publicClient.transport.url!,
    },
  })
  const transaction = await limitOrder({
    chainId: cloberTestChain.id,
    userAddress: account.address,
    inputToken: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    outputToken: '0x0000000000000000000000000000000000000000',
    amount: '1',
    price: '0.01',
    options: {
      signature,
      rpcUrl: publicClient.transport.url!,
      postOnly: true,
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
      },
    }),
  ])

  expect(beforeBalance - afterBalance).toEqual(1000000n)
  expect(
    getSize(afterMarket.bids, 0, 0.01) - getSize(beforeMarket.bids, 0, 0.01),
  ).toEqual(100039694430551600000)
})

test('make ask order', async () => {
  const { publicClient, walletClient } = clients[2] as any
  buildPublicClient(cloberTestChain.id, publicClient.transport.url!)

  const transaction = await limitOrder({
    chainId: cloberTestChain.id,
    userAddress: account.address,
    inputToken: '0x0000000000000000000000000000000000000000',
    outputToken: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    amount: '0.0015',
    price: '8000.01',
    options: {
      rpcUrl: publicClient.transport.url!,
      postOnly: true,
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
      },
    }),
  ])

  expect(beforeBalance - afterBalance).toEqual(2048655440677668n)
  expect(
    getSize(afterMarket.asks, 8000, 8001) -
      getSize(beforeMarket.asks, 8000, 8001),
  ).toEqual(1500000000000000)
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
        },
      }),
    ],
  )
  const signature = await signERC20Permit({
    chainId: cloberTestChain.id,
    account,
    token: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    amount: '100000',
    options: {
      rpcUrl: publicClient.transport.url!,
    },
  })
  const transaction = await limitOrder({
    chainId: cloberTestChain.id,
    userAddress: account.address,
    inputToken: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    outputToken: '0x0000000000000000000000000000000000000000',
    amount: '100000',
    price: '3505.01',
    options: {
      signature,
      rpcUrl: publicClient.transport.url!,
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
      },
    }),
  ])

  expect(beforeUSDCBalance - afterUSDCBalance).toEqual(100000000000n) // todo: check result
  expect(afterETHBalance - beforeETHBalance).toEqual(1327704033001898034n)
  expect(
    getSize(afterMarket.bids, 3504, 3505) -
      getSize(beforeMarket.bids, 3504, 3505),
  ).toEqual(27061899601333555000)
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

  const transaction = await limitOrder({
    chainId: cloberTestChain.id,
    userAddress: account.address,
    inputToken: '0x0000000000000000000000000000000000000000',
    outputToken: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    amount: '2',
    price: '3450.01',
    options: {
      rpcUrl: publicClient.transport.url!,
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
      },
    }),
  ])

  expect(beforeETHBalance - afterETHBalance).toEqual(2000959595585013014n)
  expect(afterUSDCBalance - beforeUSDCBalance).toEqual(3467570270n)
  expect(
    getSize(afterMarket.asks, 3450, 3451) -
      getSize(beforeMarket.asks, 3450, 3451),
  ).toEqual(1008553000000000000)
})
