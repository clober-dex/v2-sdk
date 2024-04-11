import { expect, test } from 'vitest'
import { openMarket } from '@clober/v2-sdk'

import { publicClient } from './utils/constants'
import { cloberTestChain } from './utils/test-chain'

test('try already open market', async () => {
  const transaction = await openMarket({
    chainId: cloberTestChain.id,
    inputToken: '0x0000000000000000000000000000000000000000',
    outputToken: '0x447ad4a108b5540c220f9f7e83723ac87c0f8fd8',
    options: {
      rpcUrl: publicClient.transport.url!,
    },
  })
  expect(transaction).toBeUndefined()
})
