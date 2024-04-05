import { expect, test } from 'vitest'
import { arbitrumSepolia } from 'viem/chains'
import { getAddress } from 'viem'
import { getMarket } from '@clober-dex/v2-sdk'

test('fetch open market', async () => {
  const market = await getMarket(
    arbitrumSepolia.id,
    '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    '0x0000000000000000000000000000000000000000',
  )

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
  const market = await getMarket(
    arbitrumSepolia.id,
    '0x447ad4a108b5540c220f9f7e83723ac87c0f8fd8',
    '0x0000000000000000000000000000000000000000',
  )
  expect(market.bidBookOpen).toEqual(true)
})

// @dev: this test will be fail when the market is open
test('fetch not open market', async () => {
  const market = await getMarket(
    arbitrumSepolia.id,
    '0xf18201e84ab80beef65c1eb68eea1eb1006d0e69',
    '0x0000000000000000000000000000000000000000',
  )
  expect(market.bidBookOpen).toEqual(false)
  expect(market.askBookOpen).toEqual(false)
})

test('fetch invalid market', async () => {
  expect(
    await getMarket(
      arbitrumSepolia.id,
      '0x0000000000000000000000000000000000000000',
      '0x0000000000000000000000000000000000000000',
    ).catch((e) => e.message),
  ).toEqual('Token0 and token1 must be different')
})
