import { expect, test } from 'vitest'
import { arbitrumSepolia } from 'viem/chains'
import {
  getCurrencies,
  getDailyClosePriceMap,
  getLatestPriceMap,
  getNativeCurrency,
  getReferenceCurrency,
  getStableCurrencies,
} from '@clober/v2-sdk'
import { getAddress, zeroAddress } from 'viem'

test('get native currency', async () => {
  const currency = getNativeCurrency({
    chainId: arbitrumSepolia.id,
  })
  expect(currency.address).toBe(zeroAddress)
})

test('get reference currency', async () => {
  const currency = getReferenceCurrency({
    chainId: arbitrumSepolia.id,
  })
  expect(currency.address).toBe('0xF2e615A933825De4B39b497f6e6991418Fb31b78')
})

test('get stable currencies', async () => {
  const currency = getStableCurrencies({
    chainId: arbitrumSepolia.id,
  })
  expect(currency.length).toBe(1)
  expect(currency[0].address).toBe(
    getAddress('0x00BFD44e79FB7f6dd5887A9426c8EF85A0CD23e0'),
  )
})

test('get currencies', async () => {
  const currency = await getCurrencies({
    chainId: arbitrumSepolia.id,
  })
  expect(currency.length).toBeGreaterThan(0)
})

test('get latest price map', async () => {
  const currency = await getLatestPriceMap({
    chainId: arbitrumSepolia.id,
  })
  expect(Object.keys(currency).length).toBeGreaterThan(0)
})

test('get daily close price map', async () => {
  const currency = await getDailyClosePriceMap({
    chainId: arbitrumSepolia.id,
    timestampInSeconds: 1747809910,
  })
  expect(Object.keys(currency).length).toBeGreaterThan(0)
})
