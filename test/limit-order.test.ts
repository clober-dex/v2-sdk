import { afterEach, expect, test } from 'vitest'
import { limitOrder, signERC20Permit } from '@clober-dex/v2-sdk'
import { mnemonicToAccount } from 'viem/accounts'
import { formatUnits } from 'viem'

import { toBookId } from '../src/utils/book-id'

import { cloberTestChain } from './utils/test-chain'
import { createProxyClients } from './utils/utils'
import { FORK_URL, TEST_MNEMONIC } from './utils/constants'
import { fetchTokenBalance } from './utils/currency'
import { fetchDepth } from './utils/depth'
import { fetchBlockNumer } from './utils/chain'

const clients = createProxyClients([3, 4, 5, 6, 7, 8, 9, 10])
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
            421614,
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
    '0.0001',
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
    ).find(({ price }) => 0.0001 <= price && price <= 0.0002) ?? { amount: 0n }
  ).amount
  expect(Number(beforeSize)).toEqual(0)

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
  ).find(({ price }) => 0.0001 <= price && price <= 0.0002)!.amount

  expect(beforeBalance - afterBalance).toEqual(100000000n)
  expect(Number(afterSize)).greaterThan(0)
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
    '8000.01',
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
  expect(Number(beforeSize)).toEqual(0)

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
  expect(Number(afterSize)).greaterThan(0)
})

test('make ask order', async () => {
  const { walletClient, publicClient } = clients[3]
  const transaction = await limitOrder(
    cloberTestChain.id,
    account.address,
    '0x0000000000000000000000000000000000000000',
    '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    '0.01',
    '8000.01',
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
  expect(Number(beforeSize)).toEqual(0)

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
  expect(Number(afterSize)).greaterThan(0)
})

test('make ask order with post only', async () => {
  const { walletClient, publicClient } = clients[4]
  const transaction = await limitOrder(
    cloberTestChain.id,
    account.address,
    '0x0000000000000000000000000000000000000000',
    '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    '0.01',
    '1000.01',
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
  expect(Number(beforeSize)).toEqual(0)

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
  expect(Number(afterSize)).greaterThan(0)
})

test('limit bid order', async () => {
  const bidBookId = toBookId(
    '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    '0x0000000000000000000000000000000000000000',
    1n,
  )
  const askBookId = toBookId(
    '0x0000000000000000000000000000000000000000',
    '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    10n ** 12n,
  )
  const { walletClient, publicClient } = clients[6]
  const signature = await signERC20Permit(
    cloberTestChain.id,
    account,
    '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    '1000',
    { rpcUrl: publicClient.transport.url! },
  )
  const transaction = await limitOrder(
    cloberTestChain.id,
    account.address,
    '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    '0x0000000000000000000000000000000000000000',
    '1000',
    '4030.01',
    { signature, rpcUrl: publicClient.transport.url! },
  )

  const [beforeUSDCBalance, beforeETHBalance] = await Promise.all([
    fetchTokenBalance(
      cloberTestChain.id,
      '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
      account.address,
      publicClient.transport.url!,
    ),
    publicClient.getBalance({
      address: account.address,
    }),
  ])
  const beforeBidSize = (
    (
      await fetchDepth(
        cloberTestChain.id,
        '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
        '0x0000000000000000000000000000000000000000',
        bidBookId,
        publicClient.transport.url!,
      )
    ).find(({ price }) => 4029 <= price && price <= 4030) ?? { amount: 0n }
  ).amount
  expect(Number(beforeBidSize)).toEqual(0)
  const beforeAskDepths = await fetchDepth(
    cloberTestChain.id,
    '0x0000000000000000000000000000000000000000',
    '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    askBookId,
    publicClient.transport.url!,
  )

  await walletClient.sendTransaction({ ...transaction!, account })

  const [afterUSDCBalance, afterETHBalance] = await Promise.all([
    fetchTokenBalance(
      cloberTestChain.id,
      '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
      account.address,
      publicClient.transport.url!,
    ),
    publicClient.getBalance({
      address: account.address,
    }),
  ])
  const afterBidSize = (
    await fetchDepth(
      cloberTestChain.id,
      '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
      '0x0000000000000000000000000000000000000000',
      bidBookId,
      publicClient.transport.url!,
    )
  ).find(({ price }) => 4029 <= price && price <= 4030)!.amount

  expect(beforeUSDCBalance - afterUSDCBalance).toEqual(1000000000n)
  expect(Number(formatUnits(afterETHBalance, 18))).greaterThan(
    Number(formatUnits(beforeETHBalance, 18)),
  )
  expect(Number(afterBidSize)).greaterThan(0)
  const afterAskDepths = await fetchDepth(
    cloberTestChain.id,
    '0x0000000000000000000000000000000000000000',
    '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    askBookId,
    publicClient.transport.url!,
  )
  expect(beforeAskDepths.length).greaterThan(afterAskDepths.length)
})

test('limit ask order', async () => {
  const bidBookId = toBookId(
    '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    '0x0000000000000000000000000000000000000000',
    1n,
  )
  const askBookId = toBookId(
    '0x0000000000000000000000000000000000000000',
    '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    10n ** 12n,
  )
  const { walletClient, publicClient } = clients[7]
  const transaction = await limitOrder(
    cloberTestChain.id,
    account.address,
    '0x0000000000000000000000000000000000000000',
    '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    '0.1',
    '3999.50',
    { rpcUrl: publicClient.transport.url! },
  )

  const [beforeUSDCBalance, beforeETHBalance] = await Promise.all([
    fetchTokenBalance(
      cloberTestChain.id,
      '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
      account.address,
      publicClient.transport.url!,
    ),
    publicClient.getBalance({
      address: account.address,
    }),
  ])
  const beforeAskSize = (
    (
      await fetchDepth(
        cloberTestChain.id,
        '0x0000000000000000000000000000000000000000',
        '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
        askBookId,
        publicClient.transport.url!,
      )
    ).find(({ price }) => 3999.5 <= price && price <= 3999.8) ?? { amount: 0n }
  ).amount
  expect(Number(beforeAskSize)).toEqual(0)
  const beforeBidDepths = await fetchDepth(
    cloberTestChain.id,
    '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    '0x0000000000000000000000000000000000000000',
    bidBookId,
    publicClient.transport.url!,
  )

  await walletClient.sendTransaction({ ...transaction!, account })

  const [afterUSDCBalance, afterETHBalance] = await Promise.all([
    fetchTokenBalance(
      cloberTestChain.id,
      '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
      account.address,
      publicClient.transport.url!,
    ),
    publicClient.getBalance({
      address: account.address,
    }),
  ])
  const afterAskSize = (
    await fetchDepth(
      cloberTestChain.id,
      '0x0000000000000000000000000000000000000000',
      '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
      askBookId,
      publicClient.transport.url!,
    )
  ).find(({ price }) => 3999.5 <= price && price <= 3999.8)!.amount

  expect(Number(beforeETHBalance - afterETHBalance)).greaterThan(
    100000000000000000,
  )
  expect(Number(formatUnits(afterUSDCBalance, 6))).greaterThan(
    Number(formatUnits(beforeUSDCBalance, 6)),
  )
  expect(Number(afterAskSize)).greaterThan(0)
  const afterBidDepths = await fetchDepth(
    cloberTestChain.id,
    '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    '0x0000000000000000000000000000000000000000',
    bidBookId,
    publicClient.transport.url!,
  )
  expect(beforeBidDepths.length).greaterThan(afterBidDepths.length)
})
