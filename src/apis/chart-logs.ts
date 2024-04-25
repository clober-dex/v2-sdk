import { CHAIN_IDS } from '../constants/chain'
import { CHART_LOG_INTERVALS, ChartLog } from '../type'
import { ChartLogDto } from '../model/chart-log'
import { cachedSubgraph } from '../constants/subgraph'

const CHART_LOG_INTERVAL_TIMESTAMP: {
  [key in CHART_LOG_INTERVALS]: number
} = {
  [CHART_LOG_INTERVALS.oneMinute]: 60,
  [CHART_LOG_INTERVALS.threeMinutes]: 3 * 60,
  [CHART_LOG_INTERVALS.fiveMinutes]: 5 * 60,
  [CHART_LOG_INTERVALS.tenMinutes]: 10 * 60,
  [CHART_LOG_INTERVALS.fifteenMinutes]: 15 * 60,
  [CHART_LOG_INTERVALS.thirtyMinutes]: 30 * 60,
  [CHART_LOG_INTERVALS.oneHour]: 60 * 60,
  [CHART_LOG_INTERVALS.twoHours]: 2 * 60 * 60,
  [CHART_LOG_INTERVALS.fourHours]: 4 * 60 * 60,
  [CHART_LOG_INTERVALS.sixHours]: 6 * 60 * 60,
  [CHART_LOG_INTERVALS.oneDay]: 24 * 60 * 60,
  [CHART_LOG_INTERVALS.oneWeek]: 7 * 24 * 60 * 60,
}

const PAGE_SIZE = 1000

const getChartLogs = async ({
  chainId,
  first,
  skip,
  marketCode,
  intervalType,
  from,
  to,
}: {
  chainId: CHAIN_IDS
  first: number
  skip: number
  marketCode: string
  intervalType: CHART_LOG_INTERVALS
  from: number
  to: number
}) => {
  return cachedSubgraph[chainId]!.get<{
    data: {
      chartLogs: ChartLogDto[]
    }
  }>(
    'getChartLogs',
    'query getChartLogs($first: Int!, $skip: Int!, $marketCode: String!, $intervalType: String!, $from: BigInt!, $to: BigInt!) { chartLogs( first: $first, skip: $skip, orderBy: timestamp, orderDirection: desc where: { marketCode: $marketCode, intervalType: $intervalType, timestamp_gte: $from, timestamp_lte: $to, }) { timestamp open high low close baseVolume } }',
    {
      first,
      from,
      intervalType,
      marketCode,
      skip,
      to,
    },
  )
}

const getLatestChartLog = async ({
  chainId,
  marketCode,
}: {
  chainId: CHAIN_IDS
  marketCode: string
}) => {
  return cachedSubgraph[chainId]!.get<{
    data: {
      chartLogs: ChartLogDto[]
    }
  }>(
    'getLatestChartLog',
    'query getLatestChartLog($marketCode: String!) { chartLogs( first: 1, orderBy: timestamp, orderDirection: desc where: { marketCode: $marketCode, }) { timestamp open high low close baseVolume } }',
    {
      marketCode,
    },
  )
}

export async function fetchLatestChartLog(
  chainId: CHAIN_IDS,
  marketCode: string,
): Promise<ChartLog> {
  const {
    data: { chartLogs },
  } = await getLatestChartLog({
    chainId,
    marketCode: marketCode.toLowerCase(),
  })
  return chartLogs.length > 0
    ? {
        timestamp: Number(chartLogs[0].timestamp),
        open: String(chartLogs[0].open),
        high: String(chartLogs[0].high),
        low: String(chartLogs[0].low),
        close: String(chartLogs[0].close),
        volume: String(chartLogs[0].baseVolume),
      }
    : {
        timestamp: Number(0),
        open: '0',
        high: '0',
        low: '0',
        close: '0',
        volume: '0',
      }
}

export async function fetchChartLogs(
  chainId: CHAIN_IDS,
  marketCode: string,
  intervalType: CHART_LOG_INTERVALS,
  from: number,
  to: number,
): Promise<ChartLog[]> {
  const chartLogsBetweenFromAndTo: ChartLog[] = []
  let skip = 0
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const {
      data: { chartLogs },
    } = await getChartLogs({
      chainId,
      first: PAGE_SIZE,
      skip,
      marketCode: marketCode.toLowerCase(),
      intervalType,
      from,
      to,
    })
    chartLogsBetweenFromAndTo.push(
      ...chartLogs.map((chartLog) => {
        return {
          timestamp: Number(chartLog.timestamp),
          open: String(chartLog.open),
          high: String(chartLog.high),
          low: String(chartLog.low),
          close: String(chartLog.close),
          volume: String(chartLog.baseVolume),
        }
      }),
    )
    if (chartLogs.length < PAGE_SIZE) {
      break
    }
    skip += PAGE_SIZE
  }
  chartLogsBetweenFromAndTo.sort(
    (a, b) => Number(a.timestamp) - Number(b.timestamp),
  )
  const {
    data: { chartLogs: chartLogsBeforeFrom },
  } = await getChartLogs({
    chainId,
    first: 1,
    skip: 0,
    marketCode: marketCode.toLowerCase(),
    intervalType,
    from: 0,
    to: from - 1,
  })
  let previousChartLog =
    chartLogsBeforeFrom[0] !== undefined
      ? {
          timestamp: Number(chartLogsBeforeFrom[0].timestamp),
          open: String(chartLogsBeforeFrom[0].open),
          high: String(chartLogsBeforeFrom[0].high),
          low: String(chartLogsBeforeFrom[0].low),
          close: String(chartLogsBeforeFrom[0].close),
          volume: String(chartLogsBeforeFrom[0].baseVolume),
        }
      : {
          timestamp: 0n,
          open: '0',
          high: '0',
          low: '0',
          close: '0',
          volume: '0',
        }
  const intervalInNumber = CHART_LOG_INTERVAL_TIMESTAMP[intervalType]
  const fromTimestampForAcc =
    Math.floor(from / intervalInNumber) * intervalInNumber
  const toTimestampForAcc = Math.floor(to / intervalInNumber) * intervalInNumber

  let timestampForAcc = fromTimestampForAcc
  let result: ChartLog[] = []
  while (timestampForAcc <= toTimestampForAcc) {
    const currentChartLog = chartLogsBetweenFromAndTo.find(
      (v) => v.timestamp === timestampForAcc,
    )

    if (currentChartLog) {
      result = [
        ...result,
        {
          timestamp: currentChartLog.timestamp,
          open: previousChartLog.close,
          high: currentChartLog.high,
          low: currentChartLog.low,
          close: currentChartLog.close,
          volume: currentChartLog.volume,
        },
      ]
      previousChartLog = currentChartLog
    } else {
      result = [
        ...result,
        {
          timestamp: timestampForAcc,
          open: previousChartLog.close,
          high: previousChartLog.close,
          low: previousChartLog.close,
          close: previousChartLog.close,
          volume: '0',
        },
      ]
    }

    timestampForAcc += intervalInNumber
  }

  return result
}
