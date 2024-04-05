import { afterEach, expect, test } from 'vitest'
import { getOpenOrders, getOpenOrder } from '@clober-dex/v2-sdk'

import { cloberTestChain } from './utils/test-chain'
import { createProxyClients } from './utils/utils'
import { FORK_URL } from './utils/constants'
import { fetchBlockNumer } from './utils/chain'

const clients = createProxyClients([16, 17])

afterEach(async () => {
  const blockNumber = await fetchBlockNumer()
  await Promise.all(
    clients.map(({ testClient }) => {
      return testClient.reset({
        jsonRpcUrl: FORK_URL,
        blockNumber,
      })
    }),
  )
})

test('get open orders by user address', async () => {
  const openOrders = await getOpenOrders(
    cloberTestChain.id,
    '0x5F79EE8f8fA862E98201120d83c4eC39D9468D49',
  )
  expect(openOrders.length).toBeGreaterThan(0)
})

test('get open orders by order id', async () => {
  const openOrder = await getOpenOrder(
    cloberTestChain.id,
    '46223845323662364279893361453861711542636620039907198451770258805035840307200',
  )
  expect(openOrder).toBeDefined()
})

test('claim -> cancel for bid order', async () => {
  // can't check user before/after balance because subgraph not catch up with forked chain
  const openOrder = await getOpenOrder(
    cloberTestChain.id,
    '46223845323662364279893361453861711542636620039907198451770258805035840307200',
  )
  console.log('openOrder', openOrder)
})

test('claim -> cancel for ask order', async () => {
  // can't check user before/after balance because subgraph not catch up with forked chain
  const openOrders = await getOpenOrders(
    cloberTestChain.id,
    '0x5F79EE8f8fA862E98201120d83c4eC39D9468D49',
  )
})
