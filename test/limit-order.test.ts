import { afterAll, expect, test } from 'vitest'
import { limitOrder, signERC20Permit } from '@clober-dex/v2-sdk'
import { mnemonicToAccount } from 'viem/accounts'

import { cloberTestChain } from '../src/constants/test-chain'
import { toBookId } from '../src/utils/book-id'

import { createProxyClients } from './utils/utils'
import { FORK_BLOCK_NUMBER, FORK_URL, TEST_MNEMONIC } from './utils/constants'
import { fetchTokenBalance } from './utils/currency'
import { fetchDepth } from './utils/depth'

const clients = createProxyClients([3, 4, 5, 6, 7])
const account = mnemonicToAccount(TEST_MNEMONIC)

afterAll(async () => {
  await Promise.all(
    clients.map(({ testClient }) => {
      return testClient.reset({
        jsonRpcUrl: FORK_URL,
        blockNumber: FORK_BLOCK_NUMBER,
      })
    }),
  )
})

test('limit order in not open market', async () => {
  const { publicClient } = clients[0]
  expect(
    await limitOrder(
      cloberTestChain.id,
      '0x447ad4a108b5540c220f9f7e83723ac87c0f8fd8',
      '0x447ad4a108b5540c220f9f7e83723ac87c0f8fd8',
      '0x0000000000000000000000000000000000000000',
      '10',
      '1000',
      { rpcUrl: publicClient.transport.url! },
    ).catch((e) => e.message),
  ).toEqual(`
       import { openMarket } from '@clober-dex/v2-sdk'

       const transaction = await openMarket(
            7777,
           '0x447ad4a108b5540c220f9f7e83723ac87c0f8fd8',
           '0x0000000000000000000000000000000000000000',
       )
    `)
})

test('make bid order', async () => {
  const { walletClient, publicClient } = clients[1]
  const signature = await signERC20Permit(
    cloberTestChain.id,
    account,
    '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    '100',
    { rpcUrl: publicClient.transport.url! },
  )
  const transaction = await limitOrder(
    cloberTestChain.id,
    account.address,
    '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    '0x0000000000000000000000000000000000000000',
    '100',
    '1000',
    { signature, rpcUrl: publicClient.transport.url! },
  )

  const beforeBalance = await fetchTokenBalance(
    cloberTestChain.id,
    '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    account.address,
    publicClient.transport.url!,
  )
  const bookId = toBookId(
    '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    '0x0000000000000000000000000000000000000000',
    1n,
  )
  const beforeSize = (
    (
      await fetchDepth(
        cloberTestChain.id,
        '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
        '0x0000000000000000000000000000000000000000',
        bookId,
        publicClient.transport.url!,
      )
    ).find(({ price }) => 999 <= price && price <= 1000) ?? { amount: 0n }
  ).amount

  await walletClient.sendTransaction({ ...transaction!, account })

  const afterBalance = await fetchTokenBalance(
    cloberTestChain.id,
    '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    account.address,
    publicClient.transport.url!,
  )
  const afterSize = (
    await fetchDepth(
      cloberTestChain.id,
      '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
      '0x0000000000000000000000000000000000000000',
      bookId,
      publicClient.transport.url!,
    )
  ).find(({ price }) => 999 <= price && price <= 1000)!.amount

  expect(beforeBalance - afterBalance).toEqual(100000000n)
  expect(Number(afterSize)).greaterThan(Number(beforeSize))
})

test('make bid order with post only', async () => {
  const { walletClient, publicClient } = clients[2]
  const signature = await signERC20Permit(
    cloberTestChain.id,
    account,
    '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    '100',
    { rpcUrl: publicClient.transport.url! },
  )
  const transaction = await limitOrder(
    cloberTestChain.id,
    account.address,
    '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    '0x0000000000000000000000000000000000000000',
    '100',
    '8000',
    { signature, postOnly: true, rpcUrl: publicClient.transport.url! },
  )

  const beforeBalance = await fetchTokenBalance(
    cloberTestChain.id,
    '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    account.address,
    publicClient.transport.url!,
  )
  const bookId = toBookId(
    '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    '0x0000000000000000000000000000000000000000',
    1n,
  )
  const beforeSize = (
    (
      await fetchDepth(
        cloberTestChain.id,
        '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
        '0x0000000000000000000000000000000000000000',
        bookId,
        publicClient.transport.url!,
      )
    ).find(({ price }) => 7999 <= price && price <= 8000) ?? { amount: 0n }
  ).amount

  await walletClient.sendTransaction({
    ...transaction!,
    account,
  })

  const afterBalance = await fetchTokenBalance(
    cloberTestChain.id,
    '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    account.address,
    publicClient.transport.url!,
  )
  const afterSize = (
    await fetchDepth(
      cloberTestChain.id,
      '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
      '0x0000000000000000000000000000000000000000',
      bookId,
      publicClient.transport.url!,
    )
  ).find(({ price }) => 7999 <= price && price <= 8000)!.amount

  expect(beforeBalance - afterBalance).toEqual(100000000n)
  expect(Number(afterSize)).greaterThan(Number(beforeSize))
})

test('make ask order', async () => {
  const { walletClient, publicClient } = clients[3]
  const transaction = await limitOrder(
    cloberTestChain.id,
    account.address,
    '0x0000000000000000000000000000000000000000',
    '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    '0.01',
    '8000',
    { rpcUrl: publicClient.transport.url! },
  )

  const beforeBalance = await publicClient.getBalance({
    address: account.address,
  })
  const bookId = toBookId(
    '0x0000000000000000000000000000000000000000',
    '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    10n ** 12n,
  )
  const beforeSize = (
    (
      await fetchDepth(
        cloberTestChain.id,
        '0x0000000000000000000000000000000000000000',
        '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
        bookId,
        publicClient.transport.url!,
      )
    ).find(({ price }) => 8000 <= price && price <= 8001) ?? { amount: 0n }
  ).amount

  await walletClient.sendTransaction({
    ...transaction!,
    account,
  })

  const afterBalance = await publicClient.getBalance({
    address: account.address,
  })
  const afterSize = (
    await fetchDepth(
      cloberTestChain.id,
      '0x0000000000000000000000000000000000000000',
      '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
      bookId,
      publicClient.transport.url!,
    )
  ).find(({ price }) => 8000 <= price && price <= 8001)!.amount

  expect(Number(beforeBalance - afterBalance)).greaterThan(Number(10n ** 16n))
  expect(Number(afterSize)).greaterThan(Number(beforeSize))
})

test('make ask order with post only', async () => {
  const { walletClient, publicClient } = clients[4]
  const transaction = await limitOrder(
    cloberTestChain.id,
    account.address,
    '0x0000000000000000000000000000000000000000',
    '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    '0.01',
    '1000',
    { postOnly: true, rpcUrl: publicClient.transport.url! },
  )

  const beforeBalance = await publicClient.getBalance({
    address: account.address,
  })
  const bookId = toBookId(
    '0x0000000000000000000000000000000000000000',
    '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    10n ** 12n,
  )
  const beforeSize = (
    (
      await fetchDepth(
        cloberTestChain.id,
        '0x0000000000000000000000000000000000000000',
        '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
        bookId,
        publicClient.transport.url!,
      )
    ).find(({ price }) => 1000 <= price && price <= 1001) ?? { amount: 0n }
  ).amount

  await walletClient.sendTransaction({
    ...transaction!,
    account,
  })

  const afterBalance = await publicClient.getBalance({
    address: account.address,
  })
  const afterSize = (
    await fetchDepth(
      cloberTestChain.id,
      '0x0000000000000000000000000000000000000000',
      '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
      bookId,
      publicClient.transport.url!,
    )
  ).find(({ price }) => 1000 <= price && price <= 1001)!.amount

  expect(Number(beforeBalance - afterBalance)).greaterThan(Number(10n ** 16n))
  expect(Number(afterSize)).greaterThan(Number(beforeSize))
})
