import { CHAIN_IDS } from '../constants/chain'
import { CHART_LOG_INTERVALS, ChartLog } from '../types'
import { fetchChartLogs, fetchLatestChartLog } from '../entities/chart/apis'

/**
 * Retrieves the latest chart log for a specific market.
 *
 * @param {CHAIN_IDS} params.chainId - The ID of the blockchain.
 * @param {`0x${string}`} params.quote - The address of the quote token.
 * @param {`0x${string}`} params.base - The address of the base token.
 * @returns {Promise<ChartLog>} A promise that resolves with the latest chart log.
 *
 * @example
 * import { getLatestChartLog } from '@clober/v2-sdk'
 *
 * const logs = await getLatestChartLog({
 *   chainId: 421614,
 *   quote: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
 *   base: '0x0000000000000000000000000000000000000000',
 * })
 */
export const getLatestChartLog = async ({
  chainId,
  quote,
  base,
}: {
  chainId: CHAIN_IDS
  quote: `0x${string}`
  base: `0x${string}`
}): Promise<ChartLog> => {
  return fetchLatestChartLog(chainId, `${base}/${quote}`)
}

/**
 * Retrieves chart logs for a specific market within a specified time interval.
 *
 * @param {CHAIN_IDS} params.chainId - The ID of the chain.
 * @param {`0x${string}`} params.quote - The address of the quote token.
 * @param {`0x${string}`} params.base - The address of the base token.
 * @param {CHART_LOG_INTERVALS} params.intervalType - The type of time interval for the chart logs.
 * @param {number} params.from - The start of the time interval (Unix timestamp in seconds).
 * @param {number} params.to - The end of the time interval (Unix timestamp in seconds).
 * @returns {Promise<ChartLog[]>} A promise that resolves with an array of chart logs within the specified interval.
 *
 * @example
 * import { getLatestChartLog, CHART_LOG_INTERVALS } from '@clober/v2-sdk'
 *
 * const logs = await getChartLogs({
 *   chainId: 421614,
 *   quote: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
 *   base: '0x0000000000000000000000000000000000000000',
 *   intervalType: CHART_LOG_INTERVALS.oneDay,
 *   from: 1687305600,
 *   to: 1713312000,
 * })
 */

export const getChartLogs = async ({
  chainId,
  quote,
  base,
  intervalType,
  from,
  to,
}: {
  chainId: CHAIN_IDS
  quote: `0x${string}`
  base: `0x${string}`
  intervalType: CHART_LOG_INTERVALS
  from: number
  to: number
}): Promise<ChartLog[]> => {
  return fetchChartLogs(chainId, `${base}/${quote}`, intervalType, from, to)
}
