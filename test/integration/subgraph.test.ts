import { expect, test } from 'vitest'

import {
  getCurrencies,
  getDailyClosePriceMap,
  getLatestPriceMap,
  getMarketSnapshot,
  getMarketSnapshots,
  getNativeCurrency,
  getOpenOrder,
  getOpenOrders,
  getPoolSnapshot,
  getPoolSnapshots,
  getProtocolAnalytics,
  getReferenceCurrency,
  getStableCurrencies,
  getSubgraphBlock,
  getSubgraphBlockNumber,
  getSubgraphEndpoint,
  getTopUsersByNativeVolume,
  getUserDailyVolumes,
  getUserNativeVolume,
} from '../../src'

const DEV_WALLET = '0x88748318ce7fA8650f4C79C6a2e065eA5e0F5d67'

// test('get latest chart log', async () => {
//   const latestLog = await getLatestChartLog({
//     chainId: 143,
//     quote: MOCK_USDC,
//     base: zeroAddress,
//   })
//   expect(latestLog).toBeDefined()
// })

// test('get chart logs', async () => {
//   const chartLogs = await getChartLogs({
//     chainId: 143,
//     quote: MOCK_USDC,
//     base: zeroAddress,
//     from: 1687305600,
//     to: 1713312000,
//     intervalType: CHART_LOG_INTERVALS.oneDay,
//   })
//   expect(chartLogs).toBeDefined()
//   expect(chartLogs.length).toBeGreaterThan(0)
// })

test('get subgraph endpoint', async () => {
  const endpoint = await getSubgraphEndpoint({
    chainId: 143,
  })
  expect(endpoint).toBeDefined()
})

test('get subgraph block number', async () => {
  const blockNumber = await getSubgraphBlockNumber({
    chainId: 143,
  })
  expect(Number(blockNumber)).toBeGreaterThan(0)
})

test('get subgraph block', async () => {
  const block = await getSubgraphBlock({
    chainId: 143,
  })
  expect(Number(block.blockNumber)).toBeGreaterThan(0)
  expect(Number(block.timestamp)).toBeGreaterThan(0)
})

test('get market snapshot', async () => {
  const marketSnapshots = await getMarketSnapshots({
    chainId: 143,
  })

  const marketSnapshot = await getMarketSnapshot({
    chainId: 143,
    token0: marketSnapshots[0].base.address,
    token1: marketSnapshots[0].quote.address,
  })

  expect(marketSnapshots.length).toBeGreaterThan(0)
  expect(marketSnapshot).not.toBeNull()
})

test('get pool snapshot', async () => {
  const poolSnapshots = await getPoolSnapshots({
    chainId: 143,
  })

  const poolSnapshot = await getPoolSnapshot({
    chainId: 143,
    poolKey: poolSnapshots[0].key,
  })

  expect(poolSnapshots.length).toBeGreaterThan(0)
  expect(poolSnapshot.key).toBe(poolSnapshots[0].key)
  expect(poolSnapshot.chainId).toBe(143)
})

test('get open order', async () => {
  const openOrders = await getOpenOrders({
    chainId: 143,
    userAddress: DEV_WALLET,
  })

  const openOrder = await getOpenOrder({
    chainId: 143,
    id: openOrders[0].id,
  })

  expect(openOrders.length).toBeGreaterThan(0)
  expect(openOrder.id).toBe(openOrders[0].id)
  expect(openOrder.user).toBe(DEV_WALLET)
})

test('get native currency', async () => {
  const nativeCurrency = await getNativeCurrency({
    chainId: 143,
  })
  expect(nativeCurrency).toBeDefined()
})

test('get reference currency', async () => {
  const referenceCurrency = await getReferenceCurrency({
    chainId: 143,
  })
  expect(referenceCurrency).toBeDefined()
})

test('get currencies', async () => {
  const currencies = await getCurrencies({
    chainId: 143,
  })
  expect(currencies.length).toBeGreaterThan(0)
})

test('get stable currencies', async () => {
  const stableCurrencies = getStableCurrencies({
    chainId: 143,
  })
  expect(stableCurrencies.length).toBeGreaterThan(0)
})

test('get latest price map', async () => {
  const latestPriceMap = await getLatestPriceMap({
    chainId: 143,
  })
  expect(Object.keys(latestPriceMap).length).toBeGreaterThan(0)
})

test('get daily close price map', async () => {
  const dailyClosePriceMap = await getDailyClosePriceMap({
    chainId: 143,
    timestampInSeconds: Math.floor(Date.now() / 1000),
  })
  expect(Object.keys(dailyClosePriceMap).length).toBeGreaterThan(0)
})

test('get protocol analytics', async () => {
  const analyticsSummary = await getProtocolAnalytics({
    chainId: 143,
  })
  expect(analyticsSummary.analyticsSnapshots.length).toBeGreaterThan(0)
})

test('get user daily volumes', async () => {
  const userVolumeSnapshots = await getUserDailyVolumes({
    chainId: 143,
    userAddress: DEV_WALLET,
  })
  expect(userVolumeSnapshots.length).toBeGreaterThan(0)
})

test('get top users by native volume', async () => {
  const topUsers = await getTopUsersByNativeVolume({
    chainId: 143,
  })
  expect(topUsers.length).toBeGreaterThan(0)
})

test('get user native volume', async () => {
  const userNativeVolume = await getUserNativeVolume({
    chainId: 143,
    userAddress: DEV_WALLET,
  })
  expect(userNativeVolume).toBeGreaterThan(0)
})
