import { expect, test } from 'vitest'
import {
  getOpenOrders,
  getOpenOrder,
  claimOrders,
  setApprovalOfOpenOrdersForAll,
  cancelOrders,
} from '@clober-dex/v2-sdk'

import { cloberTestChain } from './utils/test-chain'
import { account, publicClient, walletClient } from './utils/constants'

test('get open orders by user address', async () => {
  const openOrders = await getOpenOrders(
    cloberTestChain.id,
    '0xf18Be2a91cF31Fc3f8D828b6c714e1806a75e0AA',
    {
      rpcUrl: publicClient.transport.url!,
    },
  )
  expect(openOrders.length).toBeGreaterThan(0)
})

test('get undefined open orders', async () => {
  expect(
    await getOpenOrder(cloberTestChain.id, '200', {
      rpcUrl: publicClient.transport.url!,
    }).catch((e) => e.message),
  ).toEqual('Open order not found: 200')
})

test.skip('claim all orders', async () => {
  const openOrders = (
    await getOpenOrders(cloberTestChain.id, account.address, {
      rpcUrl: publicClient.transport.url!,
    })
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
            ${cloberTestChain.id},
            privateKeyToAccount('0x...')
       )
    `)

  // be sure to approve before claim
  await publicClient.waitForTransactionReceipt({
    hash: (await setApprovalOfOpenOrdersForAll(cloberTestChain.id, account, {
      rpcUrl: publicClient.transport.url!,
    }))!,
  })

  const transaction = await claimOrders(
    cloberTestChain.id,
    account.address,
    openOrders.map((order) => order.id),
    { rpcUrl: publicClient.transport.url! },
  )

  await walletClient.sendTransaction({ ...transaction, account })
})

test.skip('cancel all orders', async () => {
  const openOrders = (
    await getOpenOrders(cloberTestChain.id, account.address, {
      rpcUrl: publicClient.transport.url!,
    })
  )
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
            ${cloberTestChain.id},
            privateKeyToAccount('0x...')
       )
    `)

  // be sure to approve before cancel
  await publicClient.waitForTransactionReceipt({
    hash: (await setApprovalOfOpenOrdersForAll(cloberTestChain.id, account, {
      rpcUrl: publicClient.transport.url!,
    }))!,
  })

  const transaction = await cancelOrders(
    cloberTestChain.id,
    account.address,
    openOrders.map((order) => order.id),
    { rpcUrl: publicClient.transport.url! },
  )

  await walletClient.sendTransaction({ ...transaction, account })
})
