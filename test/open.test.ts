import { afterEach, expect, test } from 'vitest'
import { mnemonicToAccount } from 'viem/accounts'
import { openMarket } from '@clober-dex/v2-sdk'

import { cloberTestChain } from './utils/test-chain'
import { createProxyClients } from './utils/utils'
import { FORK_URL, TEST_MNEMONIC } from './utils/constants'
import { fetchBlockNumer } from './utils/chain'

const clients = createProxyClients([1, 2])
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

// @dev: this test will be fail when the market is open
test('try open market', async () => {
  const { publicClient, walletClient } = clients[0]
  const transaction = await openMarket(
    cloberTestChain.id,
    '0x447ad4a108b5540c220f9f7e83723ac87c0f8fd8',
    '0x0000000000000000000000000000000000000000',
    { rpcUrl: publicClient.transport.url! },
  )
  const hash = await walletClient.sendTransaction({
    ...transaction!,
    account,
  })
  const receipt = await publicClient.waitForTransactionReceipt({
    hash,
  })
  expect(receipt.status).toEqual('success')
})

test('try already open market', async () => {
  const { publicClient } = clients[1]
  const transaction = await openMarket(
    cloberTestChain.id,
    '0x0000000000000000000000000000000000000000',
    '0x447ad4a108b5540c220f9f7e83723ac87c0f8fd8',
    { rpcUrl: publicClient.transport.url! },
  )
  expect(transaction).toBeUndefined()
})
