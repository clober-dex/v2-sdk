import { expect, test } from 'vitest'
import { arbitrumSepolia, monadTestnet } from 'viem/chains'
import { getAddress } from 'viem'
import {
  getMarket,
  getMarketSnapshot,
  getMarketSnapshots,
  getQuoteToken,
} from '@clober/v2-sdk'

import { cloberTestChain } from '../src/constants/networks/test-chain'

import { createProxyClients } from './utils/utils'

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

  const market = await getMarket({
    chainId: cloberTestChain.id,
    token0: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    token1: '0x0000000000000000000000000000000000000000',
    options: {
      rpcUrl: publicClient.transport.url!,
      useSubgraph: false,
    },
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

  expect(market.bidBook.isOpened).toEqual(true)
  expect(market.askBook.isOpened).toEqual(true)
})

test('fetch open market with subgraph', async () => {
  const market = await getMarket({
    chainId: cloberTestChain.id,
    token0: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    token1: '0x0000000000000000000000000000000000000000',
    options: {
      useSubgraph: true,
    },
  })
  expect(market.chainId).toEqual(cloberTestChain.id)
  expect(market.quote.address).toEqual(
    '0x00BFD44e79FB7f6dd5887A9426c8EF85A0CD23e0',
  )
  expect(market.base.address).toEqual(
    '0x0000000000000000000000000000000000000000',
  )
})

test('fetch market snapshot', async () => {
  const marketSnapshots = await getMarketSnapshot({
    chainId: monadTestnet.id,
    token0: '0x0000000000000000000000000000000000000000',
    token1: '0xf817257fed379853cDe0fa4F97AB987181B1E5Ea',
    options: {
      timestampInSeconds: 1741996800,
    },
  })
  expect(marketSnapshots!.chainId).toEqual(monadTestnet.id)
  expect(marketSnapshots!.quote.address).toEqual(
    '0xf817257fed379853cDe0fa4F97AB987181B1E5Ea',
  )
  expect(marketSnapshots!.base.address).toEqual(
    '0x0000000000000000000000000000000000000000',
  )
})

test('fetch market snapshots', async () => {
  const marketSnapshots = await getMarketSnapshots({
    chainId: monadTestnet.id,
    options: {
      timestampInSeconds: 1741996800,
    },
  })
  expect(marketSnapshots.length).toBeGreaterThan(0)
})

test('fetch empty market', async () => {
  const market = await getMarket({
    chainId: arbitrumSepolia.id,
    token0: '0x447ad4a108b5540c220f9f7e83723ac87c0f8fd8',
    token1: '0x0000000000000000000000000000000000000000',
    options: {
      useSubgraph: false,
    },
  })
  expect(market.bidBook.isOpened).toEqual(false)
  expect(market.askBook.isOpened).toEqual(false)
})

// @dev: this test will be fail when the market is open
test('fetch not open market', async () => {
  const market = await getMarket({
    chainId: arbitrumSepolia.id,
    token0: '0x0e12A07A610056067063cB208882fD5a032B1505',
    token1: '0x0000000000000000000000000000000000000000',
    options: {
      useSubgraph: false,
    },
  })
  expect(market.bidBook.isOpened).toEqual(false)
  expect(market.askBook.isOpened).toEqual(false)
})

test('fetch invalid market', async () => {
  expect(
    await getMarket({
      chainId: arbitrumSepolia.id,
      token0: '0x0000000000000000000000000000000000000000',
      token1: '0x0000000000000000000000000000000000000000',
      options: {
        useSubgraph: false,
      },
    }).catch((e) => e.message),
  ).toEqual('Token0 and token1 must be different')
})
