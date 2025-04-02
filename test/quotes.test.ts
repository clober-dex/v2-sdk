import { expect, test } from 'vitest'

import { quotes } from '../src/utils/quotes'
test('quotes', async () => {
  expect(quotes(1000000n, 0.9999, 1847.11, 6, 18)).toEqual(541332135065047n)
  expect(quotes(1000000000000000000n, 1847.11, 0.9999, 18, 6)).toEqual(
    1847294729n,
  )
})
