import { expect, test, afterEach } from 'vitest'
import { getMarket, openMarket } from '@clober/v2-sdk'

import { buildPublicClient } from '../src/constants/client'

import { account, FORK_BLOCK_NUMBER, FORK_URL } from './utils/constants'
import { cloberTestChain } from './utils/test-chain'
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
  buildPublicClient(cloberTestChain.id, publicClient.transport.url!)

  const transaction1 = await openMarket({
    chainId: cloberTestChain.id,
    inputToken: '0xEfC8df673Ac18CFa6b92A1eE8939C84506C9Faf3',
    outputToken: '0x0000000000000000000000000000000000000000',
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
    },
  })
  expect(market1.askBookOpen).toEqual(true)
  expect(market1.bidBookOpen).toEqual(false)

  const transaction2 = await openMarket({
    chainId: cloberTestChain.id,
    inputToken: '0xEfC8df673Ac18CFa6b92A1eE8939C84506C9Faf3',
    outputToken: '0x0000000000000000000000000000000000000000',
  })
  await walletClient.sendTransaction({
    ...transaction2!,
    account,
    gasPrice: transaction2!.gasPrice! * 2n,
  })
  const market2 = await getMarket({
    chainId: cloberTestChain.id,
    token0: '0x0000000000000000000000000000000000000000',
    token1: '0xEfC8df673Ac18CFa6b92A1eE8939C84506C9Faf3',
    options: {
      rpcUrl: publicClient.transport.url!,
    },
  })
  expect(market2.askBookOpen).toEqual(true)
  expect(market2.bidBookOpen).toEqual(true)
})

test('try already open market', async () => {
  const { publicClient } = clients[1] as any
  buildPublicClient(cloberTestChain.id, publicClient.transport.url!)

  const transaction = await openMarket({
    chainId: cloberTestChain.id,
    inputToken: '0x0000000000000000000000000000000000000000',
    outputToken: '0x447ad4a108b5540c220f9f7e83723ac87c0f8fd8',
    options: {
      rpcUrl: publicClient.transport.url!,
    },
  })
  expect(transaction).toBeUndefined()
})
