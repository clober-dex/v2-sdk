import { expect, test } from 'vitest'
import { monadTestnet } from 'viem/chains'
import { getProtocolAnalytics, getUserDailyVolumes } from '@clober/v2-sdk'

import { getTopUsersByNativeVolume } from '../src/views/analytics'

test('get protocol analytics', async () => {
  const analyticsSummary = await getProtocolAnalytics({
    chainId: monadTestnet.id,
  })
  expect(analyticsSummary.analyticsSnapshots.length).toBeGreaterThan(0)
})

test('get user daily volumes', async () => {
  const userVolumeSnapshots = await getUserDailyVolumes({
    chainId: monadTestnet.id,
    userAddress: '0x5F79EE8f8fA862E98201120d83c4eC39D9468D49',
  })
  expect(userVolumeSnapshots.length).toBeGreaterThan(0)
})

test('get top users by native volume', async () => {
  const userVolumeSnapshots = await getTopUsersByNativeVolume({
    chainId: monadTestnet.id,
  })
  expect(userVolumeSnapshots.length).toBeGreaterThan(0)
})
