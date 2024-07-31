import { afterEach, expect, test } from 'vitest'
import {
  approveERC20,
  cancelOrder,
  cancelOrders,
  claimOrder,
  claimOrders,
  getOpenOrder,
  getOpenOrders,
  limitOrder,
  setApprovalOfOpenOrdersForAll,
} from '@clober/v2-sdk'
import { getAddress } from 'viem'

import { cloberTestChain } from '../src/constants/test-chain'

import { account, FORK_BLOCK_NUMBER, FORK_URL } from './utils/constants'
import { createProxyClients } from './utils/utils'
import { fetchTokenBalance } from './utils/currency'
import { fetchOrders } from './utils/order'

const clients = createProxyClients(
  Array.from({ length: 9 }, () => Math.floor(new Date().getTime())).map(
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

  const openOrders = await getOpenOrders({
    chainId: cloberTestChain.id,
    userAddress: '0x000000000000000000000000000000000000dead',
    options: {
      rpcUrl: publicClient.transport.url!,
    },
  })
  expect(openOrders.length).toBe(0) // TODO: check the actual length
})

test('get undefined open orders', async () => {
  const { publicClient } = clients[1] as any

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

test('claim ask order', async () => {
  const { publicClient, walletClient } = clients[2] as any

  const approveHash = await approveERC20({
    chainId: cloberTestChain.id,
    walletClient,
    token: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    amount: '100000',
    options: {
      rpcUrl: publicClient.transport.url!,
      useSubgraph: false,
    },
  })
  const approveReceipt = await publicClient.waitForTransactionReceipt({
    hash: approveHash!,
  })
  expect(approveReceipt.status).toEqual('success')

  const { transaction: takeTx } = await limitOrder({
    chainId: cloberTestChain.id,
    userAddress: account.address,
    inputToken: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    outputToken: '0x0000000000000000000000000000000000000000',
    amount: '100000',
    price: '3505.01',
    options: {
      rpcUrl: publicClient.transport.url!,
      useSubgraph: false,
    },
  })

  expect(
    (
      await fetchOrders(publicClient, cloberTestChain.id, [
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
      await fetchOrders(publicClient, cloberTestChain.id, [
        50784203244917507140848199044778666621202412111794785971205812514094254653440n,
      ])
    ).map((order) => order.claimable),
  ).toEqual([100030n])

  // be sure to approve before claim
  const hash = await setApprovalOfOpenOrdersForAll({
    chainId: cloberTestChain.id,
    walletClient,
    options: {
      rpcUrl: publicClient.transport.url!,
      useSubgraph: false,
    },
  })
  if (hash) {
    await publicClient.waitForTransactionReceipt({ hash })
  }

  const beforeBalance = await fetchTokenBalance(
    publicClient,
    cloberTestChain.id,
    '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    account.address,
  )
  const { transaction, result } = await claimOrder({
    chainId: cloberTestChain.id,
    userAddress: account.address,
    id: '50784203244917507140848199044778666621202412111794785971205812514094254653440',
    options: {
      rpcUrl: publicClient.transport.url!,
      useSubgraph: false,
    },
  })

  await walletClient.sendTransaction({ ...transaction, account })

  const afterBalance = await fetchTokenBalance(
    publicClient,
    cloberTestChain.id,
    '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    account.address,
  )

  expect(
    (
      await fetchOrders(publicClient, cloberTestChain.id, [
        50784203244917507140848199044778666621202412111794785971205812514094254653440n,
      ])
    ).map((order) => order.claimable),
  ).toEqual([0n])
  expect(afterBalance - beforeBalance).toEqual(350131739n)
  expect(result.direction).toEqual('out')
  expect(result.currency.address).toEqual(
    getAddress('0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0'),
  )
  expect(result.amount).toEqual('350.131739')
})

test('claim bid order', async () => {
  const { publicClient, walletClient } = clients[6] as any

  await publicClient.waitForTransactionReceipt({
    hash: await walletClient.sendTransaction({
      account: '0x5F79EE8f8fA862E98201120d83c4eC39D9468D49',
      to: account.address,
      value: 2000000000000000000n,
    }),
  })

  const { transaction: takeTx } = await limitOrder({
    chainId: cloberTestChain.id,
    userAddress: account.address,
    outputToken: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    inputToken: '0x0000000000000000000000000000000000000000',
    amount: '2',
    price: '3005.01',
    options: {
      rpcUrl: publicClient.transport.url!,
      useSubgraph: false,
    },
  })

  expect(
    (
      await fetchOrders(publicClient, cloberTestChain.id, [
        46223845323662364279893361453861711542636620039907198451770260500482770337792n,
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
      await fetchOrders(publicClient, cloberTestChain.id, [
        46223845323662364279893361453861711542636620039907198451770260500482770337792n,
      ])
    ).map((order) => order.claimable),
  ).toEqual([3471041312n])

  // be sure to approve before claim
  const hash = await setApprovalOfOpenOrdersForAll({
    chainId: cloberTestChain.id,
    walletClient,
    options: {
      rpcUrl: publicClient.transport.url!,
      useSubgraph: false,
    },
  })
  if (hash) {
    await publicClient.waitForTransactionReceipt({ hash })
  }

  const beforeBalance = await publicClient.getBalance({
    address: account.address,
  })
  const { transaction, result } = await claimOrder({
    chainId: cloberTestChain.id,
    userAddress: account.address,
    id: '46223845323662364279893361453861711542636620039907198451770260500482770337792',
    options: {
      rpcUrl: publicClient.transport.url!,
      useSubgraph: false,
    },
  })

  await walletClient.sendTransaction({ ...transaction, account })

  const afterBalance = await publicClient.getBalance({
    address: account.address,
  })

  expect(
    (
      await fetchOrders(publicClient, cloberTestChain.id, [
        46223845323662364279893361453861711542636620039907198451770260500482770337792n,
      ])
    ).map((order) => order.claimable),
  ).toEqual([0n])
  expect(Number(afterBalance)).greaterThan(Number(beforeBalance))
  expect(result.direction).toEqual('out')
  expect(result.currency.address).toEqual(
    '0x0000000000000000000000000000000000000000',
  )
  expect(result.amount).toEqual('0.991749515426862713')
})

test('claim orders', async () => {
  const { publicClient, walletClient } = clients[3] as any

  await publicClient.waitForTransactionReceipt({
    hash: await walletClient.sendTransaction({
      account: '0x5F79EE8f8fA862E98201120d83c4eC39D9468D49',
      to: account.address,
      value: 2000000000000000000n,
    }),
  })

  expect(
    (
      await fetchOrders(publicClient, cloberTestChain.id, [
        50784203244917507140848199044778666621202412111794785971205812514094254653440n, // ask
        50784203244917507140848199044778666621202412111794785971205812483307929075712n, // ask
        46223845323662364279893361453861711542636620039907198451770260500482770337792n, // bid
        46223845323662364279893361453861711542636620039907198451770259962821584355328n, // bid
      ])
    ).map((order) => order.claimable),
  ).toEqual([0n, 0n, 0n, 0n])

  const { transaction: takeTx1 } = await limitOrder({
    chainId: cloberTestChain.id,
    userAddress: account.address,
    inputToken: '0x0000000000000000000000000000000000000000',
    outputToken: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    amount: '2',
    price: '3250.01',
    options: {
      rpcUrl: publicClient.transport.url!,
      useSubgraph: false,
    },
  })
  await walletClient.sendTransaction({
    ...takeTx1!,
    account,
    gasPrice: takeTx1!.gasPrice! * 2n,
  })

  const approveHash = await approveERC20({
    chainId: cloberTestChain.id,
    walletClient,
    token: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    amount: '5000000',
    options: { rpcUrl: publicClient.transport.url!, useSubgraph: false },
  })
  const approveReceipt = await publicClient.waitForTransactionReceipt({
    hash: approveHash!,
  })
  expect(approveReceipt.status).toEqual('success')

  const { transaction: takeTx2 } = await limitOrder({
    chainId: cloberTestChain.id,
    userAddress: account.address,
    inputToken: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    outputToken: '0x0000000000000000000000000000000000000000',
    amount: '5000000',
    price: '3555.01',
    options: {
      rpcUrl: publicClient.transport.url!,
      useSubgraph: false,
    },
  })
  await walletClient.sendTransaction({
    ...takeTx2!,
    account,
    gasPrice: takeTx2!.gasPrice! * 2n,
  })

  expect(
    (
      await fetchOrders(publicClient, cloberTestChain.id, [
        50784203244917507140848199044778666621202412111794785971205812514094254653440n, // ask
        50784203244917507140848199044778666621202412111794785971205812483307929075712n, // ask
        46223845323662364279893361453861711542636620039907198451770260500482770337792n, // bid
        46223845323662364279893361453861711542636620039907198451770259962821584355328n, // bid
      ])
    ).map((order) => order.claimable),
  ).toEqual([100030n, 60018n, 3471041312n, 1000300090n])

  // be sure to approve before claim
  const hash = await setApprovalOfOpenOrdersForAll({
    chainId: cloberTestChain.id,
    walletClient,
    options: {
      rpcUrl: publicClient.transport.url!,
      useSubgraph: false,
    },
  })
  if (hash) {
    await publicClient.waitForTransactionReceipt({ hash })
  }

  const [beforeUSDCBalance, beforeETHBalance] = await Promise.all([
    fetchTokenBalance(
      publicClient,
      cloberTestChain.id,
      '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
      account.address,
    ),
    publicClient.getBalance({
      address: account.address,
    }),
  ])
  const { transaction, result } = await claimOrders({
    chainId: cloberTestChain.id,
    userAddress: account.address,
    ids: [
      '50784203244917507140848199044778666621202412111794785971205812514094254653440', // ask
      '50784203244917507140848199044778666621202412111794785971205812483307929075712', // ask
      '46223845323662364279893361453861711542636620039907198451770260500482770337792', // bid
      '46223845323662364279893361453861711542636620039907198451770259962821584355328', // bid
    ],
    options: {
      rpcUrl: publicClient.transport.url!,
      useSubgraph: false,
    },
  })

  await walletClient.sendTransaction({ ...transaction, account })

  const [afterUSDCBalance, afterETHBalance] = await Promise.all([
    fetchTokenBalance(
      publicClient,
      cloberTestChain.id,
      '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
      account.address,
    ),
    publicClient.getBalance({
      address: account.address,
    }),
  ])

  expect(
    (
      await fetchOrders(publicClient, cloberTestChain.id, [
        50784203244917507140848199044778666621202412111794785971205812514094254653440n, // ask
        50784203244917507140848199044778666621202412111794785971205812483307929075712n, // ask
        46223845323662364279893361453861711542636620039907198451770260500482770337792n, // bid
        46223845323662364279893361453861711542636620039907198451770259962821584355328n, // bid
      ])
    ).map((order) => order.claimable),
  ).toEqual([0n, 0n, 0n, 0n])
  expect(afterUSDCBalance - beforeUSDCBalance).toEqual(560799798n)
  expect(Number(afterETHBalance - beforeETHBalance)).greaterThan(
    1290000000000000000,
  )
  expect(result.length).toEqual(2)
  expect(result[1].amount).toEqual('1.2918788605298377')
  expect(result[1].direction).toEqual('out')
  expect(result[1].currency.address).toEqual(
    getAddress('0x0000000000000000000000000000000000000000'),
  )

  expect(result[0].amount).toEqual('560.799798')
  expect(result[0].direction).toEqual('out')
  expect(result[0].currency.address).toEqual(
    getAddress('0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0'),
  )
})

test('cancel ask order', async () => {
  const { publicClient, walletClient } = clients[4] as any

  // be sure to approve before claim
  const hash = await setApprovalOfOpenOrdersForAll({
    chainId: cloberTestChain.id,
    walletClient,
    options: {
      rpcUrl: publicClient.transport.url!,
      useSubgraph: false,
    },
  })
  if (hash) {
    await publicClient.waitForTransactionReceipt({ hash })
  }

  const beforeBalance = await publicClient.getBalance({
    address: account.address,
  })
  const { transaction, result } = await cancelOrder({
    chainId: cloberTestChain.id,
    userAddress: account.address,
    id: '50784203244917507140848199044778666621202412111794785971205812514094254653440',
    options: {
      rpcUrl: publicClient.transport.url!,
      useSubgraph: false,
    },
  })

  expect(
    (
      await fetchOrders(publicClient, cloberTestChain.id, [
        50784203244917507140848199044778666621202412111794785971205812514094254653440n,
      ])
    ).map((order) => order.open),
  ).toEqual([100030n])

  await walletClient.sendTransaction({ ...transaction, account })

  expect(
    (
      await fetchOrders(publicClient, cloberTestChain.id, [
        50784203244917507140848199044778666621202412111794785971205812514094254653440n,
      ])
    ).map((order) => order.open),
  ).toEqual([0n])

  const afterBalance = await publicClient.getBalance({
    address: account.address,
  })

  expect(Number(afterBalance - beforeBalance)).lessThan(100030000000000000)
  expect(result.direction).toEqual('out')
  expect(result.currency.address).toEqual(
    getAddress('0x0000000000000000000000000000000000000000'),
  )
  expect(Number(result.amount)).lessThan(0.1)
})

test('cancel bid order', async () => {
  const { publicClient, walletClient } = clients[7] as any

  // be sure to approve before claim
  const hash = await setApprovalOfOpenOrdersForAll({
    chainId: cloberTestChain.id,
    walletClient,
    options: {
      rpcUrl: publicClient.transport.url!,
      useSubgraph: false,
    },
  })
  if (hash) {
    await publicClient.waitForTransactionReceipt({ hash })
  }

  const beforeBalance = await fetchTokenBalance(
    publicClient,
    cloberTestChain.id,
    '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    account.address,
  )
  const { transaction, result } = await cancelOrder({
    chainId: cloberTestChain.id,
    userAddress: account.address,
    id: '46223845323662364279893361453861711542636620039907198451770260500482770337792',
    options: {
      rpcUrl: publicClient.transport.url!,
      useSubgraph: false,
    },
  })

  expect(
    (
      await fetchOrders(publicClient, cloberTestChain.id, [
        46223845323662364279893361453861711542636620039907198451770260500482770337792n,
      ])
    ).map((order) => order.open),
  ).toEqual([3471041312n])

  await walletClient.sendTransaction({ ...transaction, account })

  expect(
    (
      await fetchOrders(publicClient, cloberTestChain.id, [
        46223845323662364279893361453861711542636620039907198451770260500482770337792n,
      ])
    ).map((order) => order.open),
  ).toEqual([0n])

  const afterBalance = await fetchTokenBalance(
    publicClient,
    cloberTestChain.id,
    '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    account.address,
  )

  expect(Number(afterBalance - beforeBalance)).toEqual(3469999999)
  expect(result.direction).toEqual('out')
  expect(result.currency.address).toEqual(
    getAddress('0x00BFD44e79FB7f6dd5887A9426c8EF85A0CD23e0'),
  )
  expect(result.amount).toEqual('3469.999999')
})

test('cancel orders', async () => {
  const { publicClient, walletClient } = clients[5] as any

  const orderIds = [
    '46223845323662364279893361453861711542636620039907198451770259165675654217728',
    '50784203244917507140848199044778666621202412111794785971205811992925743087616',
  ]

  const status = await fetchOrders(
    publicClient,
    cloberTestChain.id,
    orderIds.map((id) => BigInt(id)),
  )
  expect(status.map((order) => order.open - order.claimable)).toEqual([
    15004501350n,
    100030n,
  ])

  // be sure to approve before claim
  const hash = await setApprovalOfOpenOrdersForAll({
    chainId: cloberTestChain.id,
    walletClient,
    options: {
      rpcUrl: publicClient.transport.url!,
      useSubgraph: false,
    },
  })
  if (hash) {
    await publicClient.waitForTransactionReceipt({ hash })
  }

  const [beforeUSDCBalance, beforeETHBalance] = await Promise.all([
    fetchTokenBalance(
      publicClient,
      cloberTestChain.id,
      '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
      account.address,
    ),
    publicClient.getBalance({
      address: account.address,
    }),
  ])
  const { transaction, result } = await cancelOrders({
    chainId: cloberTestChain.id,
    userAddress: account.address,
    ids: orderIds,
    options: {
      rpcUrl: publicClient.transport.url!,
      useSubgraph: false,
    },
  })
  await walletClient.sendTransaction({ ...transaction, account })

  const [afterUSDCBalance, afterETHBalance] = await Promise.all([
    fetchTokenBalance(
      publicClient,
      cloberTestChain.id,
      '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
      account.address,
    ),
    publicClient.getBalance({
      address: account.address,
    }),
  ])
  expect(result.length).toEqual(2)
  expect(result[0].direction).toEqual('out')
  expect(result[0].currency.address).toEqual(
    getAddress('0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0'),
  )
  expect(result[0].amount).toEqual('14999.999999')
  expect(afterUSDCBalance - beforeUSDCBalance).toEqual(14999999999n)

  expect(result[1].direction).toEqual('out')
  expect(result[1].currency.address).toEqual(
    getAddress('0x0000000000000000000000000000000000000000'),
  )
  expect(Number(afterETHBalance - beforeETHBalance)).lessThan(
    100000000000000000,
  )
  expect(Number(result[1].amount)).lessThan(0.1)
})
