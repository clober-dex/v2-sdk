import { afterEach, expect, test } from 'vitest'
import {
  getOpenOrders,
  getOpenOrder,
  claimOrders,
  marketOrder,
  signERC20Permit,
  setApprovalOfOpenOrdersForAll,
  cancelOrders,
} from '@clober-dex/v2-sdk'
import { mnemonicToAccount } from 'viem/accounts'

import { cloberTestChain } from './utils/test-chain'
import { createProxyClients } from './utils/utils'
import { FORK_URL, TEST_MNEMONIC } from './utils/constants'
import { fetchBlockNumer } from './utils/chain'
import { fetchAskDepth, fetchBidDepth } from './utils/depth'

const clients = createProxyClients([16, 17])
const account = mnemonicToAccount(TEST_MNEMONIC)

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

test('get undefined open orders', async () => {
  expect(
    await getOpenOrder(cloberTestChain.id, '200').catch((e) => e.message),
  ).toEqual('Open order not found: 200')
})

test('claim all orders', async () => {
  // can't check user before/after balance because subgraph not catch up with forked chain
  const { walletClient, publicClient } = clients[0]

  const signature = await signERC20Permit(
    cloberTestChain.id,
    account,
    '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    '1000000',
    { rpcUrl: publicClient.transport.url! },
  )
  const tx1 = await marketOrder(
    cloberTestChain.id,
    account.address,
    '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    '0x0000000000000000000000000000000000000000',
    '1000000',
    {
      signature,
      rpcUrl: publicClient.transport.url!,
    },
  )
  await walletClient.sendTransaction({ ...tx1, account })

  const tx2 = await marketOrder(
    cloberTestChain.id,
    account.address,
    '0x0000000000000000000000000000000000000000',
    '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    '100',
    {
      rpcUrl: publicClient.transport.url!,
    },
  )
  await walletClient.sendTransaction({ ...tx2, account })

  const [bidDepths, askDepths] = await Promise.all([
    fetchBidDepth(publicClient.transport.url!),
    fetchAskDepth(publicClient.transport.url!),
  ])
  expect(bidDepths.length).toBe(0)
  expect(askDepths.length).toBe(0)

  const openOrders = (
    await getOpenOrders(cloberTestChain.id, account.address)
  ).slice(0, 5)
  expect(
    await claimOrders(
      cloberTestChain.id,
      account.address,
      openOrders.map((order) => order.id),
      { rpcUrl: publicClient.transport.url! },
    ).catch((e) => e.message),
  ).toEqual(`
       import { setApprovalOfOpenOrdersForAll } from '@clober-dex/v2-sdk'

       const hash = await setApprovalOfOpenOrdersForAll(
            421614,
            privateKeyToAccount('0x...')
       )
    `)

  // be sure to approve before claim
  await setApprovalOfOpenOrdersForAll(cloberTestChain.id, account, {
    rpcUrl: publicClient.transport.url!,
  })

  const transaction = await claimOrders(
    cloberTestChain.id,
    account.address,
    openOrders.map((order) => order.id),
    { rpcUrl: publicClient.transport.url! },
  )

  await walletClient.sendTransaction({ ...transaction, account })
})

test('cancel all orders', async () => {
  // can't check user before/after balance because subgraph not catch up with forked chain
  const { walletClient, publicClient } = clients[0]

  const signature = await signERC20Permit(
    cloberTestChain.id,
    account,
    '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    '1000000',
    { rpcUrl: publicClient.transport.url! },
  )
  const tx1 = await marketOrder(
    cloberTestChain.id,
    account.address,
    '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    '0x0000000000000000000000000000000000000000',
    '1000000',
    {
      signature,
      rpcUrl: publicClient.transport.url!,
    },
  )
  await walletClient.sendTransaction({ ...tx1, account })

  const tx2 = await marketOrder(
    cloberTestChain.id,
    account.address,
    '0x0000000000000000000000000000000000000000',
    '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    '100',
    {
      rpcUrl: publicClient.transport.url!,
    },
  )
  await walletClient.sendTransaction({ ...tx2, account })

  const [bidDepths, askDepths] = await Promise.all([
    fetchBidDepth(publicClient.transport.url!),
    fetchAskDepth(publicClient.transport.url!),
  ])
  expect(bidDepths.length).toBe(0)
  expect(askDepths.length).toBe(0)

  const openOrders = (await getOpenOrders(cloberTestChain.id, account.address))
    .filter((order) => order.cancelable)
    .slice(0, 5)
  expect(
    await cancelOrders(
      cloberTestChain.id,
      account.address,
      openOrders.map((order) => order.id),
      { rpcUrl: publicClient.transport.url! },
    ).catch((e) => e.message),
  ).toEqual(`
       import { setApprovalOfOpenOrdersForAll } from '@clober-dex/v2-sdk'

       const hash = await setApprovalOfOpenOrdersForAll(
            421614,
            privateKeyToAccount('0x...')
       )
    `)

  // be sure to approve before cancel
  await setApprovalOfOpenOrdersForAll(cloberTestChain.id, account, {
    rpcUrl: publicClient.transport.url!,
  })

  const transaction = await cancelOrders(
    cloberTestChain.id,
    account.address,
    openOrders.map((order) => order.id),
    { rpcUrl: publicClient.transport.url! },
  )

  await walletClient.sendTransaction({ ...transaction, account })
})
