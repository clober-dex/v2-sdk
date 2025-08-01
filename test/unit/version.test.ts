import { expect, test } from 'vitest'
import { getVersion } from '@clober/v2-sdk'

test('check toBookId function', async () => {
  const version = getVersion()
  expect(version).toBeDefined()
})
