import { expect, test } from 'vitest'
import {
  getOpenOrders,
  getOpenOrder,
  claimOrders,
  setApprovalOfOpenOrdersForAll,
  cancelOrders,
} from '@clober/v2-sdk'

import { cloberTestChain } from './utils/test-chain'
import { account, publicClient, walletClient } from './utils/constants'

const IS_LOCAL = process.env.IS_LOCAL === 'true'

test.runIf(IS_LOCAL)('get open orders by user address', async () => {
  const openOrders = await getOpenOrders({
    chainId: cloberTestChain.id,
    userAddress: '0xf18Be2a91cF31Fc3f8D828b6c714e1806a75e0AA',
    options: {
      rpcUrl: publicClient.transport.url!,
    },
  })
  expect(openOrders.length).toBeGreaterThan(0)
})

test.runIf(IS_LOCAL)('get undefined open orders', async () => {
  expect(
    await getOpenOrder({
      chainId: cloberTestChain.id,
      id: '200',
      options: {
        rpcUrl: publicClient.transport.url!,
      },
    }).catch((e) => e.message),
  ).toEqual('Open order not found: 200')
})

test.runIf(IS_LOCAL)('claim all orders', async () => {
  const openOrders = (
    await getOpenOrders({
      chainId: cloberTestChain.id,
      userAddress: account.address,
      options: {
        rpcUrl: publicClient.transport.url!,
      },
    })
  ).slice(0, 20)

  // be sure to approve before claim
  const hash = await setApprovalOfOpenOrdersForAll({
    chainId: cloberTestChain.id,
    account,
    options: {
      rpcUrl: publicClient.transport.url!,
    },
  })
  if (hash) {
    await publicClient.waitForTransactionReceipt({ hash })
  }

  const transaction = await claimOrders({
    chainId: cloberTestChain.id,
    userAddress: account.address,
    ids: openOrders.map((order) => order.id),
    options: {
      rpcUrl: publicClient.transport.url!,
    },
  })

  await walletClient.sendTransaction({ ...transaction, account })
})

test.runIf(IS_LOCAL)('cancel all orders', async () => {
  const openOrders = (
    await getOpenOrders({
      chainId: cloberTestChain.id,
      userAddress: account.address,
      options: {
        rpcUrl: publicClient.transport.url!,
      },
    })
  )
    .filter((order) => order.cancelable)
    .slice(0, 20)

  // be sure to approve before claim
  const hash = await setApprovalOfOpenOrdersForAll({
    chainId: cloberTestChain.id,
    account,
    options: {
      rpcUrl: publicClient.transport.url!,
    },
  })
  if (hash) {
    await publicClient.waitForTransactionReceipt({ hash })
  }

  const transaction = await cancelOrders({
    chainId: cloberTestChain.id,
    userAddress: account.address,
    ids: openOrders.map((order) => order.id),
    options: {
      rpcUrl: publicClient.transport.url!,
    },
  })

  await walletClient.sendTransaction({ ...transaction, account })
})
