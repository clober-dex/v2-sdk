import { expect, test } from 'vitest'
import { arbitrumSepolia, monadTestnet } from 'viem/chains'
import { zeroAddress } from 'viem'

import { DEV_WALLET, MOCK_USDC } from '../utils/constants'
import {
  CHART_LOG_INTERVALS,
  getChartLogs,
  getCurrencies,
  getDailyClosePriceMap,
  getLatestChartLog,
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
  getLatestTrades,
} from '../../src'

test('get latest chart log', async () => {
  const latestLog = await getLatestChartLog({
    chainId: arbitrumSepolia.id,
    quote: MOCK_USDC,
    base: zeroAddress,
  })
  expect(latestLog).toBeDefined()
})

test('get chart logs', async () => {
  const chartLogs = await getChartLogs({
    chainId: arbitrumSepolia.id,
    quote: MOCK_USDC,
    base: zeroAddress,
    from: 1687305600,
    to: 1713312000,
    intervalType: CHART_LOG_INTERVALS.oneDay,
  })
  expect(chartLogs).toBeDefined()
  expect(chartLogs.length).toBeGreaterThan(0)
})

test('get subgraph endpoint', async () => {
  const endpoint = await getSubgraphEndpoint({
    chainId: monadTestnet.id,
  })
  expect(endpoint).toBeDefined()
})

test('get subgraph block number', async () => {
  const blockNumber = await getSubgraphBlockNumber({
    chainId: monadTestnet.id,
  })
  expect(Number(blockNumber)).toBeGreaterThan(0)
})

test('get subgraph block', async () => {
  const block = await getSubgraphBlock({
    chainId: monadTestnet.id,
  })
  expect(Number(block.blockNumber)).toBeGreaterThan(0)
  expect(Number(block.timestamp)).toBeGreaterThan(0)
})

test('get market snapshot', async () => {
  const marketSnapshots = await getMarketSnapshots({
    chainId: monadTestnet.id,
  })

  const marketSnapshot = await getMarketSnapshot({
    chainId: monadTestnet.id,
    token0: marketSnapshots[0].base.address,
    token1: marketSnapshots[0].quote.address,
  })

  expect(marketSnapshots.length).toBeGreaterThan(0)
  expect(marketSnapshot).not.toBeNull()
})

test('get pool snapshot', async () => {
  const poolSnapshots = await getPoolSnapshots({
    chainId: monadTestnet.id,
  })

  const poolSnapshot = await getPoolSnapshot({
    chainId: monadTestnet.id,
    poolKey: poolSnapshots[0].key,
  })

  expect(poolSnapshots.length).toBeGreaterThan(0)
  expect(poolSnapshot.key).toBe(poolSnapshots[0].key)
  expect(poolSnapshot.chainId).toBe(monadTestnet.id)
})

test('get open order', async () => {
  const openOrders = await getOpenOrders({
    chainId: arbitrumSepolia.id,
    userAddress: DEV_WALLET,
  })

  const openOrder = await getOpenOrder({
    chainId: arbitrumSepolia.id,
    id: openOrders[0].id,
  })

  expect(openOrders.length).toBeGreaterThan(0)
  expect(openOrder.id).toBe(openOrders[0].id)
  expect(openOrder.user).toBe(DEV_WALLET)
})

test('get native currency', async () => {
  const nativeCurrency = await getNativeCurrency({
    chainId: monadTestnet.id,
  })
  expect(nativeCurrency).toBeDefined()
})

test('get reference currency', async () => {
  const referenceCurrency = await getReferenceCurrency({
    chainId: monadTestnet.id,
  })
  expect(referenceCurrency).toBeDefined()
})

test('get currencies', async () => {
  const currencies = await getCurrencies({
    chainId: monadTestnet.id,
  })
  expect(currencies.length).toBeGreaterThan(0)
})

test('get stable currencies', async () => {
  const stableCurrencies = getStableCurrencies({
    chainId: monadTestnet.id,
  })
  expect(stableCurrencies.length).toBeGreaterThan(0)
})

test('get latest price map', async () => {
  const latestPriceMap = await getLatestPriceMap({
    chainId: monadTestnet.id,
  })
  expect(Object.keys(latestPriceMap).length).toBeGreaterThan(0)
})

test('get daily close price map', async () => {
  const dailyClosePriceMap = await getDailyClosePriceMap({
    chainId: monadTestnet.id,
    timestampInSeconds: Math.floor(Date.now() / 1000),
  })
  expect(Object.keys(dailyClosePriceMap).length).toBeGreaterThan(0)
})

test('get protocol analytics', async () => {
  const analyticsSummary = await getProtocolAnalytics({
    chainId: monadTestnet.id,
  })
  expect(analyticsSummary.analyticsSnapshots.length).toBeGreaterThan(0)
})

test('get user daily volumes', async () => {
  const userVolumeSnapshots = await getUserDailyVolumes({
    chainId: monadTestnet.id,
    userAddress: DEV_WALLET,
  })
  expect(userVolumeSnapshots.length).toBeGreaterThan(0)
})

test('get top users by native volume', async () => {
  const topUsers = await getTopUsersByNativeVolume({
    chainId: monadTestnet.id,
  })
  expect(topUsers.length).toBeGreaterThan(0)
})

test('get user native volume', async () => {
  const userNativeVolume = await getUserNativeVolume({
    chainId: monadTestnet.id,
    userAddress: DEV_WALLET,
  })
  expect(userNativeVolume).toBeGreaterThan(0)
})
