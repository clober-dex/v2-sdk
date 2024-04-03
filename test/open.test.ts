import { afterAll, expect, test } from 'vitest'
import { mnemonicToAccount } from 'viem/accounts'
import { createWalletClient, http } from 'viem'
import { arbitrumSepolia } from 'viem/chains'
import { openMarket } from '@clober-dex/v2-sdk'

import { createProxyClients } from './utils/utils'
import { FORK_BLOCK_NUMBER, FORK_URL, TEST_MNEMONIC } from './utils/constants'

const clients = createProxyClients([1])
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

test('try open market', async () => {
  const [{ publicClient }] = clients
  const walletClient = createWalletClient({
    account,
    chain: arbitrumSepolia,
    transport: http(publicClient.transport.url),
  })

  const transaction = await openMarket(
    arbitrumSepolia.id,
    '0x447ad4a108b5540c220f9f7e83723ac87c0f8fd8',
    '0x0000000000000000000000000000000000000000',
  )
  const hash = await walletClient.sendTransaction(transaction!)
  const receipt = await publicClient.waitForTransactionReceipt({
    hash,
  })
  expect(receipt.status).toEqual('success')
})

test('try already open market', async () => {
  const transaction = await openMarket(
    arbitrumSepolia.id,
    '0x0000000000000000000000000000000000000000',
    '0x447ad4a108b5540c220f9f7e83723ac87c0f8fd8',
  )
  expect(transaction).toBeUndefined()
})
