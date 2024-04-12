import { expect, test, afterEach } from 'vitest'
import { openMarket } from '@clober/v2-sdk'

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

  const transaction = await openMarket({
    chainId: cloberTestChain.id,
    inputToken: '0x5E86396Bb0eC915c2ab1980d9453Fa8924803223',
    outputToken: '0x0000000000000000000000000000000000000000',
  })
  const hash = await walletClient.sendTransaction({
    ...transaction!,
    account,
  })
  const receipt = await publicClient.waitForTransactionReceipt({
    hash,
  })
  expect(receipt.status).toEqual('success')
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
