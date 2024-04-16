import { expect, test } from 'vitest'
import {
  CHART_LOG_INTERVALS,
  getChartLogs,
  getLatestChartLog,
} from '@clober/v2-sdk'
import { arbitrumSepolia } from 'viem/chains'

test('check chart functions', async () => {
  const latestLog = await getLatestChartLog({
    chainId: arbitrumSepolia.id,
    quote: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    base: '0x0000000000000000000000000000000000000000',
  })
  expect(latestLog).toBeDefined()

  const logs = await getChartLogs({
    chainId: arbitrumSepolia.id,
    quote: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    base: '0x0000000000000000000000000000000000000000',
    from: 1687305600,
    to: 1713312000,
    intervalType: CHART_LOG_INTERVALS.oneDay,
  })
  expect(logs).toBeDefined()
  expect(logs.length).toBeGreaterThan(0)
})
