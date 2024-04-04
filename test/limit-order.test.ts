import { afterAll, expect, test } from 'vitest'
import { limitOrder, signERC20Permit } from '@clober-dex/v2-sdk'
import { createWalletClient, http } from 'viem'
import { mnemonicToAccount } from 'viem/accounts'

import { cloberTestChain } from '../src/constants/test-chain'
import { toBookId } from '../src/utils/book-id'

import { createProxyClients } from './utils/utils'
import { FORK_BLOCK_NUMBER, FORK_URL, TEST_MNEMONIC } from './utils/constants'
import { fetchTokenBalance } from './utils/currency'
import { fetchDepth } from './utils/depth'

const clients = createProxyClients([2])
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
  expect(
    await limitOrder(
      cloberTestChain.id,
      '0x447ad4a108b5540c220f9f7e83723ac87c0f8fd8',
      '0x447ad4a108b5540c220f9f7e83723ac87c0f8fd8',
      '0x0000000000000000000000000000000000000000',
      '10',
      '1000',
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
  const walletClient = createWalletClient({
    account,
    chain: cloberTestChain,
    transport: http(),
  })

  const signature = await signERC20Permit(
    cloberTestChain.id,
    account,
    '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    '100',
  )
  const transaction = await limitOrder(
    cloberTestChain.id,
    account.address,
    '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    '0x0000000000000000000000000000000000000000',
    '100',
    '1000',
    signature,
  )

  const beforeBalance = await fetchTokenBalance(
    cloberTestChain.id,
    '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    account.address,
  )
  const bookId = toBookId(
    '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    '0x0000000000000000000000000000000000000000',
    1n,
  )
  const beforeSize = (
    await fetchDepth(
      cloberTestChain.id,
      '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
      '0x0000000000000000000000000000000000000000',
      bookId,
    )
  ).find(({ price }) => 999 <= price && price <= 1000)!.amount

  await walletClient.sendTransaction(transaction!)

  const afterBalance = await fetchTokenBalance(
    cloberTestChain.id,
    '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    account.address,
  )
  const afterSize = (
    await fetchDepth(
      cloberTestChain.id,
      '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
      '0x0000000000000000000000000000000000000000',
      bookId,
    )
  ).find(({ price }) => 999 <= price && price <= 1000)!.amount

  expect(beforeBalance - afterBalance).toEqual(100000000n)
  expect(Number(afterSize)).greaterThan(Number(beforeSize))
})

test('make ask order', async () => {
  const [{ publicClient }] = clients
  const walletClient = createWalletClient({
    account,
    chain: cloberTestChain,
    transport: http(),
  })

  const transaction = await limitOrder(
    cloberTestChain.id,
    account.address,
    '0x0000000000000000000000000000000000000000',
    '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    '0.01',
    '8000',
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
    await fetchDepth(
      cloberTestChain.id,
      '0x0000000000000000000000000000000000000000',
      '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
      bookId,
    )
  ).find(({ price }) => 8000 <= price && price <= 8001)!.amount

  await walletClient.sendTransaction(transaction!)

  const afterBalance = await fetchTokenBalance(
    cloberTestChain.id,
    '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    account.address,
  )
  const afterSize = (
    await fetchDepth(
      cloberTestChain.id,
      '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
      '0x0000000000000000000000000000000000000000',
      bookId,
    )
  ).find(({ price }) => 8000 <= price && price <= 8001)!.amount

  expect(beforeBalance - afterBalance).toEqual(10000000000000000n)
  expect(Number(afterSize)).greaterThan(Number(beforeSize))
})
