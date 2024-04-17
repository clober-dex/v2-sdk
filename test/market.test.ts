import { expect, test } from 'vitest'
import { arbitrumSepolia } from 'viem/chains'
import { getAddress } from 'viem'
import { getMarket, getQuoteToken } from '@clober/v2-sdk'

import { buildPublicClient } from '../src/constants/client'

import { createProxyClients } from './utils/utils'
import { cloberTestChain } from './utils/test-chain'

const clients = createProxyClients(
  Array.from({ length: 4 }, () => Math.floor(new Date().getTime())).map(
    (id) => id,
  ),
)

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

test('fetch open market', async () => {
  const { publicClient } = clients[0] as any
  buildPublicClient(cloberTestChain.id, publicClient.transport.url!)

  const market = await getMarket({
    chainId: arbitrumSepolia.id,
    token0: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    token1: '0x0000000000000000000000000000000000000000',
  })

  expect(market.makerFee).toEqual(-0.03)
  expect(market.takerFee).toEqual(0.1)

  expect(market.quote.address).toEqual(
    getAddress('0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0'),
  )
  expect(market.quote.symbol).toEqual('MT')
  expect(market.quote.name).toEqual('MockERC20')
  expect(market.quote.decimals).toEqual(6)

  expect(market.base.address).toEqual(
    getAddress('0x0000000000000000000000000000000000000000'),
  )
  expect(market.base.symbol).toEqual('ETH')
  expect(market.base.name).toEqual('Ethereum')
  expect(market.base.decimals).toEqual(18)

  expect(market.bidBookOpen).toEqual(true)
  expect(market.askBookOpen).toEqual(true)
})

test('fetch empty market', async () => {
  const { publicClient } = clients[1] as any
  buildPublicClient(cloberTestChain.id, publicClient.transport.url!)

  const market = await getMarket({
    chainId: arbitrumSepolia.id,
    token0: '0x447ad4a108b5540c220f9f7e83723ac87c0f8fd8',
    token1: '0x0000000000000000000000000000000000000000',
  })
  expect(market.bidBookOpen).toEqual(true)
})

// @dev: this test will be fail when the market is open
test('fetch not open market', async () => {
  const { publicClient } = clients[2] as any
  buildPublicClient(cloberTestChain.id, publicClient.transport.url!)

  const market = await getMarket({
    chainId: arbitrumSepolia.id,
    token0: '0x0e12A07A610056067063cB208882fD5a032B1505',
    token1: '0x0000000000000000000000000000000000000000',
  })
  expect(market.bidBookOpen).toEqual(false)
  expect(market.askBookOpen).toEqual(false)
})

test('fetch invalid market', async () => {
  const { publicClient } = clients[3] as any
  buildPublicClient(cloberTestChain.id, publicClient.transport.url!)

  expect(
    await getMarket({
      chainId: arbitrumSepolia.id,
      token0: '0x0000000000000000000000000000000000000000',
      token1: '0x0000000000000000000000000000000000000000',
    }).catch((e) => e.message),
  ).toEqual('Token0 and token1 must be different')
})
