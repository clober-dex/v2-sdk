import { afterEach, expect, test } from 'vitest'
import { limitOrder, signERC20Permit } from '@clober-dex/v2-sdk'
import { mnemonicToAccount } from 'viem/accounts'
import { formatUnits } from 'viem'

import { cloberTestChain } from './utils/test-chain'
import { createProxyClients } from './utils/utils'
import { FORK_URL, TEST_MNEMONIC } from './utils/constants'
import { fetchTokenBalance } from './utils/currency'
import { fetchBlockNumer } from './utils/chain'
import { fetchAskDepth, fetchBidDepth, getSize } from './utils/depth'

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
    '0.01',
    { signature, rpcUrl: publicClient.transport.url!, postOnly: true },
  )

  const [beforeBalance, beforeDepth] = await Promise.all([
    fetchTokenBalance(
      cloberTestChain.id,
      '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
      account.address,
      publicClient.transport.url!,
    ),
    fetchBidDepth(publicClient.transport.url!),
  ])

  await walletClient.sendTransaction({ ...transaction!, account })

  const [afterBalance, afterDepth] = await Promise.all([
    fetchTokenBalance(
      cloberTestChain.id,
      '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
      account.address,
      publicClient.transport.url!,
    ),
    fetchBidDepth(publicClient.transport.url!),
  ])

  expect(beforeBalance - afterBalance).toEqual(100000000n)
  expect(getSize(afterDepth, 0, 0.01)).greaterThan(
    getSize(beforeDepth, 0, 0.01),
  )
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

  const [beforeBalance, beforeDepth] = await Promise.all([
    publicClient.getBalance({
      address: account.address,
    }),
    fetchAskDepth(publicClient.transport.url!),
  ])

  await walletClient.sendTransaction({
    ...transaction!,
    account,
  })

  const [afterBalance, afterDepth] = await Promise.all([
    publicClient.getBalance({
      address: account.address,
    }),
    fetchAskDepth(publicClient.transport.url!),
  ])

  expect(Number(beforeBalance - afterBalance)).greaterThan(Number(10n ** 16n))
  expect(getSize(afterDepth, 8000, 8001)).greaterThan(
    getSize(beforeDepth, 8000, 8001),
  )
})

test('limit bid order', async () => {
  const { walletClient, publicClient } = clients[6]
  const signature = await signERC20Permit(
    cloberTestChain.id,
    account,
    '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    '10000000',
    { rpcUrl: publicClient.transport.url! },
  )
  const transaction = await limitOrder(
    cloberTestChain.id,
    account.address,
    '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    '0x0000000000000000000000000000000000000000',
    '10000000',
    '10000.01',
    { signature, rpcUrl: publicClient.transport.url! },
  )

  const [beforeUSDCBalance, beforeETHBalance, beforeBidDepth, beforeAskDepth] =
    await Promise.all([
      fetchTokenBalance(
        cloberTestChain.id,
        '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
        account.address,
        publicClient.transport.url!,
      ),
      publicClient.getBalance({
        address: account.address,
      }),
      fetchBidDepth(publicClient.transport.url!),
      fetchAskDepth(publicClient.transport.url!),
    ])
  // order book should not be empty
  expect(beforeBidDepth.length).toBeGreaterThan(0)
  expect(beforeAskDepth.length).toBeGreaterThan(0)

  await walletClient.sendTransaction({ ...transaction!, account })

  const [afterUSDCBalance, afterETHBalance, afterBidDepth, afterAskDepth] =
    await Promise.all([
      fetchTokenBalance(
        cloberTestChain.id,
        '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
        account.address,
        publicClient.transport.url!,
      ),
      publicClient.getBalance({
        address: account.address,
      }),
      fetchBidDepth(publicClient.transport.url!),
      fetchAskDepth(publicClient.transport.url!),
    ])

  expect(beforeUSDCBalance - afterUSDCBalance).toEqual(10000000000000n)
  expect(Number(formatUnits(afterETHBalance, 18))).greaterThan(
    Number(formatUnits(beforeETHBalance, 18)),
  )
  expect(beforeAskDepth.length).toBeGreaterThan(afterAskDepth.length)
  expect(getSize(afterBidDepth, 9999, 10000)).greaterThan(
    getSize(beforeBidDepth, 9999, 10000),
  )
})

test('limit ask order', async () => {
  const { walletClient, publicClient } = clients[7]
  const transaction = await limitOrder(
    cloberTestChain.id,
    account.address,
    '0x0000000000000000000000000000000000000000',
    '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    '100',
    '0.01',
    { rpcUrl: publicClient.transport.url! },
  )

  const [beforeUSDCBalance, beforeETHBalance, beforeBidDepth, beforeAskDepth] =
    await Promise.all([
      fetchTokenBalance(
        cloberTestChain.id,
        '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
        account.address,
        publicClient.transport.url!,
      ),
      publicClient.getBalance({
        address: account.address,
      }),
      fetchBidDepth(publicClient.transport.url!),
      fetchAskDepth(publicClient.transport.url!),
    ])
  // order book should not be empty
  expect(beforeBidDepth.length).toBeGreaterThan(0)
  expect(beforeAskDepth.length).toBeGreaterThan(0)

  await walletClient.sendTransaction({ ...transaction!, account })

  const [afterUSDCBalance, afterETHBalance, afterBidDepth, afterAskDepth] =
    await Promise.all([
      fetchTokenBalance(
        cloberTestChain.id,
        '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
        account.address,
        publicClient.transport.url!,
      ),
      publicClient.getBalance({
        address: account.address,
      }),
      fetchBidDepth(publicClient.transport.url!),
      fetchAskDepth(publicClient.transport.url!),
    ])

  expect(beforeETHBalance - afterETHBalance).toBeGreaterThan(
    100000000000000000000,
  )
  expect(Number(formatUnits(afterUSDCBalance, 18))).greaterThan(
    Number(formatUnits(beforeUSDCBalance, 18)),
  )
  expect(getSize(afterAskDepth, 0.01, 0.02)).greaterThan(
    getSize(beforeAskDepth, 0.01, 0.02),
  )
  expect(beforeBidDepth.length).toBeGreaterThan(afterBidDepth.length)
})
