import { afterEach, expect, test } from 'vitest'
import {
  getOpenOrders,
  getOpenOrder,
  claimOrders,
  setApprovalOfOpenOrdersForAll,
  signERC20Permit,
  limitOrder,
  claimOrder,
} from '@clober/v2-sdk'

import { buildPublicClient } from '../src/constants/client'

import { cloberTestChain } from './utils/test-chain'
import { account, FORK_BLOCK_NUMBER, FORK_URL } from './utils/constants'
import { createProxyClients } from './utils/utils'
import { fetchOpenOrders } from './utils/open-order'

const clients = createProxyClients(
  Array.from({ length: 4 }, () => Math.floor(new Date().getTime())).map(
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

test('get open orders by user address', async () => {
  const { publicClient } = clients[0] as any
  buildPublicClient(cloberTestChain.id, publicClient.transport.url!)

  const openOrders = await getOpenOrders({
    chainId: cloberTestChain.id,
    userAddress: '0xf18Be2a91cF31Fc3f8D828b6c714e1806a75e0AA',
    options: {
      rpcUrl: publicClient.transport.url!,
    },
  })
  expect(openOrders.length).toBeGreaterThan(0)
})

test('get undefined open orders', async () => {
  const { publicClient } = clients[1] as any
  buildPublicClient(cloberTestChain.id, publicClient.transport.url!)

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

test('claim order', async () => {
  const { publicClient, walletClient } = clients[2] as any
  buildPublicClient(cloberTestChain.id, publicClient.transport.url!)

  const signature = await signERC20Permit({
    chainId: cloberTestChain.id,
    account,
    token: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    amount: '100000',
    options: {
      rpcUrl: publicClient.transport.url!,
    },
  })
  const { transaction: takeTx } = await limitOrder({
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

  expect(
    (
      await fetchOpenOrders(cloberTestChain.id, [
        50784203244917507140848199044778666621202412111794785971205812514094254653440n,
      ])
    ).map((order) => order.claimable),
  ).toEqual([0n])

  await walletClient.sendTransaction({
    ...takeTx!,
    account,
    gasPrice: takeTx!.gasPrice! * 2n,
  })

  expect(
    (
      await fetchOpenOrders(cloberTestChain.id, [
        50784203244917507140848199044778666621202412111794785971205812514094254653440n,
      ])
    ).map((order) => order.claimable),
  ).toEqual([100030n])

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

  const { transaction } = await claimOrder({
    chainId: cloberTestChain.id,
    userAddress: account.address,
    id: '50784203244917507140848199044778666621202412111794785971205812514094254653440',
    options: {
      rpcUrl: publicClient.transport.url!,
    },
  })

  await walletClient.sendTransaction({ ...transaction, account })

  expect(
    (
      await fetchOpenOrders(cloberTestChain.id, [
        50784203244917507140848199044778666621202412111794785971205812514094254653440n,
      ])
    ).map((order) => order.claimable),
  ).toEqual([0n])
})

test('claim orders', async () => {
  const { publicClient, walletClient } = clients[2] as any
  buildPublicClient(cloberTestChain.id, publicClient.transport.url!)

  const signature = await signERC20Permit({
    chainId: cloberTestChain.id,
    account,
    token: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    amount: '100000',
    options: {
      rpcUrl: publicClient.transport.url!,
    },
  })
  const { transaction: takeTx } = await limitOrder({
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

  expect(
    (
      await fetchOpenOrders(cloberTestChain.id, [
        50784203244917507140848199044778666621202412111794785971205812514094254653440n,
        50784203244917507140848199044778666621202412111794785971205812483307929075712n,
      ])
    ).map((order) => order.claimable),
  ).toEqual([0n, 0n])

  await walletClient.sendTransaction({
    ...takeTx!,
    account,
    gasPrice: takeTx!.gasPrice! * 2n,
  })

  expect(
    (
      await fetchOpenOrders(cloberTestChain.id, [
        50784203244917507140848199044778666621202412111794785971205812514094254653440n,
        50784203244917507140848199044778666621202412111794785971205812483307929075712n,
      ])
    ).map((order) => order.claimable),
  ).toEqual([100030n, 60018n])

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

  const { transaction } = await claimOrders({
    chainId: cloberTestChain.id,
    userAddress: account.address,
    ids: [
      '50784203244917507140848199044778666621202412111794785971205812514094254653440',
      '50784203244917507140848199044778666621202412111794785971205812483307929075712',
    ],
    options: {
      rpcUrl: publicClient.transport.url!,
    },
  })

  await walletClient.sendTransaction({ ...transaction, account })

  expect(
    (
      await fetchOpenOrders(cloberTestChain.id, [
        50784203244917507140848199044778666621202412111794785971205812514094254653440n,
        50784203244917507140848199044778666621202412111794785971205812483307929075712n,
      ])
    ).map((order) => order.claimable),
  ).toEqual([0n, 0n])
})
