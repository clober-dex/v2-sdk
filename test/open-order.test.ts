import { afterEach, expect, test } from 'vitest'
import { getOpenOrders } from '@clober-dex/v2-sdk'

import { cloberTestChain } from './utils/test-chain'
import { createProxyClients } from './utils/utils'
import { FORK_URL } from './utils/constants'
import { fetchBlockNumer } from './utils/chain'

const clients = createProxyClients([16])

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
