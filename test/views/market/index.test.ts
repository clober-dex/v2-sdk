import { test } from 'vitest'

import { setUp } from '../../setup'

test('getMarket', async () => {
  const { publicClient, walletClient, tokenAddress } = await setUp()
  console.log('publicClient', tokenAddress)

  const { publicClient: a, walletClient: b, tokenAddress: c } = await setUp()
  console.log('publicClient', c)
})
