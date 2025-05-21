import { expect, test } from 'vitest'
import { arbitrumSepolia } from 'viem/chains'
import {
  getCurrencies,
  getDailyClosePriceMap,
  getLatestPriceMap,
  getNativeCurrency,
  getReferenceCurrency,
} from '@clober/v2-sdk'
import { zeroAddress } from 'viem'

test('get native currency', async () => {
  const currency = await getNativeCurrency({
    chainId: arbitrumSepolia.id,
  })
  expect(currency.address).toBe(zeroAddress)
})

test('get reference currency', async () => {
  const currency = await getReferenceCurrency({
    chainId: arbitrumSepolia.id,
  })
  expect(currency.address).toBe('0xF2e615A933825De4B39b497f6e6991418Fb31b78')
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
