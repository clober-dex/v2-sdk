import { expect, test } from 'vitest'

import { getQuoteAmountFromPrices } from '../src/entities/pool/utils/mint'

test('quotes', async () => {
  expect(getQuoteAmountFromPrices(1000000n, 0.9999, 1847.11, 6, 18)).toEqual(
    541332135065047n,
  )
  expect(
    getQuoteAmountFromPrices(1000000000000000000n, 1847.11, 0.9999, 18, 6),
  ).toEqual(1847294729n)
})
