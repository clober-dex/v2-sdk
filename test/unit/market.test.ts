import { expect, test } from 'vitest/index'
import { arbitrumSepolia } from 'viem/chains'
import { getAddress } from 'viem'
import { getQuoteToken } from '@clober/v2-sdk'

test('get quote token', async () => {
  expect(
    getQuoteToken({
      chainId: arbitrumSepolia.id,
      token0: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
      token1: '0x0000000000000000000000000000000000000000',
    }),
  ).toEqual(getAddress('0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0'))

  expect(
    getQuoteToken({
      chainId: arbitrumSepolia.id,
      token0: '0x0000000000000000000000000000000000000001',
      token1: '0x0000000000000000000000000000000000000000',
    }),
  ).toEqual(getAddress('0x0000000000000000000000000000000000000000'))

  expect(
    getQuoteToken({
      chainId: arbitrumSepolia.id,
      token0: '0x0000000000000000000000000000000000000001',
      token1: '0x0000000000000000000000000000000000000002',
    }),
  ).toEqual(getAddress('0x0000000000000000000000000000000000000001'))
})
