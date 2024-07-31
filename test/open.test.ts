import { expect, test, afterEach } from 'vitest'
import { getMarket, getPool, openMarket, openPool } from '@clober/v2-sdk'
import { zeroHash } from 'viem'

import { cloberTestChain } from '../src/constants/test-chain'

import { account, FORK_BLOCK_NUMBER, FORK_URL } from './utils/constants'
import { createProxyClients } from './utils/utils'

const clients = createProxyClients(
  Array.from({ length: 2 }, () => Math.floor(new Date().getTime())).map(
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

test('try open market', async () => {
  const { publicClient, walletClient } = clients[0] as any

  const transaction1 = await openMarket({
    chainId: cloberTestChain.id,
    userAddress: account.address,
    inputToken: '0xEfC8df673Ac18CFa6b92A1eE8939C84506C9Faf3',
    outputToken: '0x0000000000000000000000000000000000000000',
    options: {
      rpcUrl: publicClient.transport.url!,
      useSubgraph: false,
    },
  })
  await walletClient.sendTransaction({
    ...transaction1!,
    account,
    gasPrice: transaction1!.gasPrice! * 2n,
  })
  const market1 = await getMarket({
    chainId: cloberTestChain.id,
    token0: '0xEfC8df673Ac18CFa6b92A1eE8939C84506C9Faf3',
    token1: '0x0000000000000000000000000000000000000000',
    options: {
      rpcUrl: publicClient.transport.url!,
      useSubgraph: false,
    },
  })
  expect(market1.askBook.isOpened).toEqual(true)
  expect(market1.bidBook.isOpened).toEqual(false)

  const transaction2 = await openMarket({
    chainId: cloberTestChain.id,
    userAddress: account.address,
    inputToken: '0x0000000000000000000000000000000000000000',
    outputToken: '0xEfC8df673Ac18CFa6b92A1eE8939C84506C9Faf3',
    options: {
      rpcUrl: publicClient.transport.url!,
      useSubgraph: false,
    },
  })
  await walletClient.sendTransaction({
    ...transaction2!,
    account,
    gasPrice: transaction2!.gasPrice! * 2n,
  })
  const market2 = await getMarket({
    chainId: cloberTestChain.id,
    token0: '0xEfC8df673Ac18CFa6b92A1eE8939C84506C9Faf3',
    token1: '0x0000000000000000000000000000000000000000',
    options: {
      rpcUrl: publicClient.transport.url!,
      useSubgraph: false,
    },
  })
  expect(market2.askBook.isOpened).toEqual(true)
  expect(market2.bidBook.isOpened).toEqual(true)
})

test('try already open market', async () => {
  const { publicClient } = clients[1] as any

  const transaction = await openMarket({
    chainId: cloberTestChain.id,
    userAddress: account.address,
    inputToken: '0x0000000000000000000000000000000000000000',
    outputToken: '0x447ad4a108b5540c220f9f7e83723ac87c0f8fd8',
    options: {
      rpcUrl: publicClient.transport.url!,
      useSubgraph: false,
    },
  })
  expect(transaction).toBeUndefined()
})

test('try open pool', async () => {
  await Promise.all(
    clients.map(({ testClient }) => {
      return testClient.reset({
        jsonRpcUrl: FORK_URL,
        blockNumber: 66686973n,
      })
    }),
  )
  const { publicClient, walletClient } = clients[0] as any
  const transaction1 = await openPool({
    chainId: cloberTestChain.id,
    userAddress: '0x5F79EE8f8fA862E98201120d83c4eC39D9468D49',
    tokenA: '0xEfC8df673Ac18CFa6b92A1eE8939C84506C9Faf3',
    tokenB: '0x0000000000000000000000000000000000000000',
    salt: zeroHash,
    options: {
      rpcUrl: publicClient.transport.url!,
      useSubgraph: false,
    },
  })
  const beforePool = await getPool({
    chainId: cloberTestChain.id,
    token0: '0xEfC8df673Ac18CFa6b92A1eE8939C84506C9Faf3',
    token1: '0x0000000000000000000000000000000000000000',
    salt: zeroHash,
    options: {
      rpcUrl: publicClient.transport.url!,
      useSubgraph: false,
    },
  })
  expect(beforePool.isOpened).toEqual(false)

  await walletClient.sendTransaction({
    ...transaction1!,
    account: '0x5F79EE8f8fA862E98201120d83c4eC39D9468D49',
    gasPrice: transaction1!.gasPrice! * 2n,
  })
  const afterPool = await getPool({
    chainId: cloberTestChain.id,
    token0: '0xEfC8df673Ac18CFa6b92A1eE8939C84506C9Faf3',
    token1: '0x0000000000000000000000000000000000000000',
    salt: zeroHash,
    options: {
      rpcUrl: publicClient.transport.url!,
      useSubgraph: false,
    },
  })
  expect(afterPool.isOpened).toEqual(true)

  const transaction2 = await openMarket({
    chainId: cloberTestChain.id,
    userAddress: '0x5F79EE8f8fA862E98201120d83c4eC39D9468D49',
    inputToken: '0x0000000000000000000000000000000000000000',
    outputToken: '0xEfC8df673Ac18CFa6b92A1eE8939C84506C9Faf3',
    options: {
      rpcUrl: publicClient.transport.url!,
      useSubgraph: false,
    },
  })
  expect(transaction2).toBeUndefined()
})
