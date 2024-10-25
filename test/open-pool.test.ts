import { beforeEach, expect, test } from 'vitest'
import { getPool, openPool } from '@clober/v2-sdk'
import { zeroHash } from 'viem'

import { cloberTestChain2 } from '../src/constants/test-chain'

import { FORK_URL } from './utils/constants'
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

test('try open pool', async () => {
  const { publicClient, walletClient } = clients[0] as any

  const transaction1 = await openPool({
    chainId: cloberTestChain2.id,
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
    chainId: cloberTestChain2.id,
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
    chainId: cloberTestChain2.id,
    token0: '0xEfC8df673Ac18CFa6b92A1eE8939C84506C9Faf3',
    token1: '0x0000000000000000000000000000000000000000',
    salt: zeroHash,
    options: {
      rpcUrl: publicClient.transport.url!,
      useSubgraph: false,
    },
  })
  expect(afterPool.isOpened).toEqual(true)

  const transaction2 = await openPool({
    chainId: cloberTestChain2.id,
    userAddress: '0x5F79EE8f8fA862E98201120d83c4eC39D9468D49',
    tokenA: '0xEfC8df673Ac18CFa6b92A1eE8939C84506C9Faf3',
    tokenB: '0x0000000000000000000000000000000000000000',
    salt: zeroHash,
    options: {
      rpcUrl: publicClient.transport.url!,
      useSubgraph: false,
    },
  })
  expect(transaction2).toBeUndefined()
})
