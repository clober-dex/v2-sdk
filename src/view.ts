import {
  createPublicClient,
  formatUnits,
  getAddress,
  http,
  isAddressEqual,
  parseUnits,
} from 'viem'

import { CHAIN_IDS, CHAIN_MAP } from './constants/chain'
import type {
  ChartLog,
  Currency,
  DefaultReadContractOptions,
  LastAmounts,
  Market,
  MarketSnapshot,
  Pool,
  PoolSnapshot,
  StrategyPosition,
} from './type'
import { CHART_LOG_INTERVALS } from './type'
import { formatPrice, parsePrice } from './utils/prices'
import {
  fetchOpenOrderByOrderIdFromSubgraph,
  fetchOpenOrdersByUserAddressFromSubgraph,
} from './entities/open-order/api'
import { OpenOrder } from './entities/open-order/model'
import { fetchChartLogs, fetchLatestChartLog } from './apis/chart-logs'
import { getMarketId } from './entities/market/utils'
import { CONTRACT_ADDRESSES } from './constants/addresses'
import { invertTick, toPrice } from './utils/tick'
import { MAX_TICK, MIN_TICK } from './constants/tick'
import {
  fetchPool,
  fetchPoolKeys,
  fetchPoolSnapshotFromSubgraph,
} from './apis/pool'
import { fetchLastAmounts, fetchStrategyPosition } from './apis/strategy'
import { Subgraph, SUBGRAPH_URL } from './constants/subgraph'
import { fetchMarket } from './entities/market/apis/market'
import { fetchMarketSnapshots } from './entities/market/apis/market-snapshot'

/**
 * Get contract addresses by chain id
 * @param chainId - chain id from {@link CHAIN_IDS}
 * @returns Contract addresses
 *
 * @example
 * import { getContractAddresses } from '@clober/v2-sdk'
 *
 * const addresses = await getContractAddresses({
 *   chainId: 421614,
 * })
 */
export const getContractAddresses = ({ chainId }: { chainId: CHAIN_IDS }) => {
  return CONTRACT_ADDRESSES[chainId]
}

/**
 * Get subgraph endpoint by chain id
 * @param chainId - chain id from {@link CHAIN_IDS}
 * @returns Subgraph endpoint
 *
 * @example
 * import { getSubgraphEndpoint } from '@clober/v2-sdk'
 *
 * const endpoint = await getSubgraphEndpoint({
 *   chainId: 421614,
 * })
 */
export const getSubgraphEndpoint = ({ chainId }: { chainId: CHAIN_IDS }) => {
  return SUBGRAPH_URL[chainId]
}

/**
 * Get subgraph block number by chain id
 * @param chainId - chain id from {@link CHAIN_IDS}
 * @returns Contract addresses
 *
 * @example
 * import { getContractAddresses } from '@clober/v2-sdk'
 *
 * const blockNumber = await getSubgraphBlockNumber({
 *   chainId: 421614,
 * })
 */
export const getSubgraphBlockNumber = async ({
  chainId,
}: {
  chainId: CHAIN_IDS
}) => {
  const {
    data: {
      _meta: {
        block: { number: blockNumber },
      },
    },
  } = await Subgraph.get<{
    data: {
      _meta: {
        block: { number: string }
      }
    }
  }>(
    chainId,
    'getLatestBlockNumber',
    'query getLatestBlockNumber { _meta { block { number } } }',
    {},
  )
  return Number(blockNumber)
}

/**
 * Get market information by chain id and token addresses
 * @param chainId - chain id from {@link CHAIN_IDS}
 * @param token0 - token0 address
 * @param token1 - token1 address
 * @param options {@link DefaultReadContractOptions} options.
 * @param options.n - number of depth levels to fetch
 * @returns A market {@link Market}
 *
 * @example
 * import { getMarket } from '@clober/v2-sdk'
 *
 * const market = await getMarket({
 *   chainId: 421614,
 *   token0: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
 *   token1: '0x0000000000000000000000000000000000000000',
 * })
 */
export const getMarket = async ({
  chainId,
  token0,
  token1,
  options,
}: {
  chainId: CHAIN_IDS
  token0: `0x${string}`
  token1: `0x${string}`
  options?: {
    n?: number
    useSubgraph?: boolean
  } & DefaultReadContractOptions
}): Promise<Market> => {
  if (isAddressEqual(token0, token1)) {
    throw new Error('Token0 and token1 must be different')
  }
  const publicClient = createPublicClient({
    chain: CHAIN_MAP[chainId],
    transport: options?.rpcUrl ? http(options.rpcUrl) : http(),
  })
  const market = await fetchMarket(
    publicClient,
    chainId,
    [token0, token1],
    !!(options && options.useSubgraph),
    options?.n,
  )
  return market.toJson()
}

export const getMarketSnapshots = async ({
  chainId,
}: {
  chainId: CHAIN_IDS
}): Promise<MarketSnapshot[]> => {
  return fetchMarketSnapshots(chainId)
}

/**
 * Get pool information by chain id and token addresses
 * @param chainId - chain id from {@link CHAIN_IDS}
 * @param token0 - token0 address
 * @param token1 - token1 address
 * @param salt - salt for the pool
 * @param options {@link DefaultReadContractOptions} options.
 * @param options.n - number of depth levels to fetch
 * @returns A pool {@link Pool}
 *
 * @example
 * import { getPool } from '@clober/v2-sdk'
 *
 * const market = await getPool({
 *   chainId: 421614,
 *   token0: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
 *   token1: '0x0000000000000000000000000000000000000000',
 *   salt: '0x0000000000000000000000000000000000000000000000000000000000000000',
 * })
 */
export const getPool = async ({
  chainId,
  token0,
  token1,
  salt,
  options,
}: {
  chainId: CHAIN_IDS
  token0: `0x${string}`
  token1: `0x${string}`
  salt: `0x${string}`
  options?: {
    market?: Market
    n?: number
    useSubgraph?: boolean
  } & DefaultReadContractOptions
}): Promise<Pool> => {
  if (isAddressEqual(token0, token1)) {
    throw new Error('Token0 and token1 must be different')
  }
  const publicClient = createPublicClient({
    chain: CHAIN_MAP[chainId],
    transport: options?.rpcUrl ? http(options.rpcUrl) : http(),
  })
  const pool = await fetchPool(
    publicClient,
    chainId,
    [token0, token1],
    salt,
    !!(options && options.useSubgraph),
    options?.market,
  )
  if (!pool.isOpened) {
    throw new Error('Pool is not opened')
  }
  return pool.toJson()
}

export const getPoolSnapshot = async ({
  chainId,
  poolKey,
}: {
  chainId: CHAIN_IDS
  poolKey: `0x${string}`
}): Promise<PoolSnapshot> => {
  const poolSnapshot = await fetchPoolSnapshotFromSubgraph(chainId, poolKey)
  if (!poolSnapshot) {
    throw new Error('Pool is not existed')
  }
  return poolSnapshot
}

export const getPoolSnapshots = async ({
  chainId,
}: {
  chainId: CHAIN_IDS
}): Promise<PoolSnapshot[]> => {
  const poolKeys = await fetchPoolKeys(chainId)
  return Promise.all(
    poolKeys.map((poolKey) => getPoolSnapshot({ chainId, poolKey })),
  )
}

export const getStrategyPrice = async ({
  chainId,
  poolKey,
  options,
}: {
  chainId: CHAIN_IDS
  poolKey: `0x${string}`
  options?: DefaultReadContractOptions
}): Promise<StrategyPosition> => {
  const publicClient = createPublicClient({
    chain: CHAIN_MAP[chainId],
    transport: options?.rpcUrl ? http(options.rpcUrl) : http(),
  })
  return fetchStrategyPosition(publicClient, chainId, poolKey)
}

export const getLastAmounts = async ({
  chainId,
  poolKey,
  options,
}: {
  chainId: CHAIN_IDS
  poolKey: `0x${string}`
  options?: DefaultReadContractOptions
}): Promise<LastAmounts> => {
  const publicClient = createPublicClient({
    chain: CHAIN_MAP[chainId],
    transport: options?.rpcUrl ? http(options.rpcUrl) : http(),
  })
  return fetchLastAmounts(publicClient, chainId, poolKey)
}

/**
 * Calculates and returns the neighboring price ticks and their corresponding prices for a given input price.
 *
 * @param {CHAIN_IDS} chainId - chain id from {@link CHAIN_IDS}
 * @param {string} price - The input price to calculate the neighborhood for, as a string.
 * @param {Currency} currency0 - token0 currency {@link Currency}.
 * @param {Currency} currency1 - token1 currency {@link Currency}.
 *
 * @returns {Object} An object containing the normal and inverted price neighborhoods. Each neighborhood includes:
 *   - up: The tick and price for one tick above the current price.
 *   - now: The tick and price for the current price.
 *   - down: The tick and price for one tick below the current price.
 */
export const getPriceNeighborhood = ({
  chainId,
  price,
  currency0,
  currency1,
}: {
  chainId: CHAIN_IDS
  price: string
  currency0: Currency
  currency1: Currency
}) => {
  const quoteTokenAddress = getQuoteToken({
    chainId,
    token0: currency0.address,
    token1: currency1.address,
  })
  const quoteCurrency = isAddressEqual(quoteTokenAddress, currency0.address)
    ? currency0
    : currency1
  const baseCurrency = isAddressEqual(quoteTokenAddress, currency0.address)
    ? currency1
    : currency0
  const { roundingDownTick, roundingUpTick } = parsePrice(
    Number(price),
    quoteCurrency.decimals,
    baseCurrency.decimals,
  )
  const bidBookTick = roundingDownTick
  const askBookTick = invertTick(roundingUpTick)
  return {
    normal: {
      nextUp: {
        tick: bidBookTick + 2n,
        price: formatPrice(
          toPrice(bidBookTick + 2n),
          quoteCurrency.decimals,
          baseCurrency.decimals,
        ),
        marketPrice: formatPrice(
          toPrice(bidBookTick + 2n),
          quoteCurrency.decimals,
          baseCurrency.decimals,
        ),
      },
      up: {
        tick: bidBookTick + 1n,
        price: formatPrice(
          toPrice(bidBookTick + 1n),
          quoteCurrency.decimals,
          baseCurrency.decimals,
        ),
        marketPrice: formatPrice(
          toPrice(bidBookTick + 1n),
          quoteCurrency.decimals,
          baseCurrency.decimals,
        ),
      },
      now: {
        tick: bidBookTick,
        price: formatPrice(
          toPrice(bidBookTick),
          quoteCurrency.decimals,
          baseCurrency.decimals,
        ),
        marketPrice: formatPrice(
          toPrice(bidBookTick),
          quoteCurrency.decimals,
          baseCurrency.decimals,
        ),
      },
      down: {
        tick: bidBookTick - 1n,
        price: formatPrice(
          toPrice(bidBookTick - 1n),
          quoteCurrency.decimals,
          baseCurrency.decimals,
        ),
        marketPrice: formatPrice(
          toPrice(bidBookTick - 1n),
          quoteCurrency.decimals,
          baseCurrency.decimals,
        ),
      },
      nextDown: {
        tick: bidBookTick - 2n,
        price: formatPrice(
          toPrice(bidBookTick - 2n),
          quoteCurrency.decimals,
          baseCurrency.decimals,
        ),
        marketPrice: formatPrice(
          toPrice(bidBookTick - 2n),
          quoteCurrency.decimals,
          baseCurrency.decimals,
        ),
      },
    },
    inverted: {
      nextUp: {
        tick: askBookTick + 2n,
        price: formatPrice(
          toPrice(askBookTick + 2n),
          baseCurrency.decimals,
          quoteCurrency.decimals,
        ),
        marketPrice: formatPrice(
          toPrice(invertTick(askBookTick + 2n)),
          quoteCurrency.decimals,
          baseCurrency.decimals,
        ),
      },
      up: {
        tick: askBookTick + 1n,
        price: formatPrice(
          toPrice(askBookTick + 1n),
          baseCurrency.decimals,
          quoteCurrency.decimals,
        ),
        marketPrice: formatPrice(
          toPrice(invertTick(askBookTick + 1n)),
          quoteCurrency.decimals,
          baseCurrency.decimals,
        ),
      },
      now: {
        tick: askBookTick,
        price: formatPrice(
          toPrice(askBookTick),
          baseCurrency.decimals,
          quoteCurrency.decimals,
        ),
        marketPrice: formatPrice(
          toPrice(invertTick(askBookTick)),
          quoteCurrency.decimals,
          baseCurrency.decimals,
        ),
      },
      down: {
        tick: askBookTick - 1n,
        price: formatPrice(
          toPrice(askBookTick - 1n),
          baseCurrency.decimals,
          quoteCurrency.decimals,
        ),
        marketPrice: formatPrice(
          toPrice(invertTick(askBookTick - 1n)),
          quoteCurrency.decimals,
          baseCurrency.decimals,
        ),
      },
      nextDown: {
        tick: askBookTick - 2n,
        price: formatPrice(
          toPrice(askBookTick - 2n),
          baseCurrency.decimals,
          quoteCurrency.decimals,
        ),
        marketPrice: formatPrice(
          toPrice(invertTick(askBookTick - 2n)),
          quoteCurrency.decimals,
          baseCurrency.decimals,
        ),
      },
    },
  }
}

/**
 * Calculates the expected output for a given input amount, based on the provided market data.
 *
 * @param chainId The chain ID of the blockchain.
 * @param inputToken The address of the input token.
 * @param outputToken The address of the output token.
 * @param amountIn The amount of expected input amount. (ex 1.2 ETH -> 1.2)
 * @param options {@link DefaultReadContractOptions} options.
 * @param options.limitPrice The maximum limit price to take.
 * @param options.roundingDownTakenBid Whether to round down the taken bid.
 * @param options.roundingUpTakenAsk Whether to round up the taken ask.
 * @returns A Promise resolving to an object containing the taken amount, spend amount and result of the calculation.
 * @example
 * import { getExpectedOutput } from '@clober/v2-sdk'
 *
 * const { takenAmount, spentAmount } = await getExpectedOutput({
 *   chainId: 421614,
 *   inputToken: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
 *   outputToken: '0x0000000000000000000000000000000000000000',
 *   amountIn: '1000.123', // spend 1000.123 USDC
 * })
 */
export const getExpectedOutput = async ({
  chainId,
  inputToken,
  outputToken,
  amountIn,
  options,
}: {
  chainId: CHAIN_IDS
  inputToken: `0x${string}`
  outputToken: `0x${string}`
  amountIn: string
  options?: {
    limitPrice?: string
    roundingDownTakenBid?: boolean
    roundingUpTakenAsk?: boolean
    useSubgraph?: boolean
  } & DefaultReadContractOptions
}): Promise<{
  takenAmount: string
  spentAmount: string
  bookId: bigint
  events: { price: string; takenAmount: string; spentAmount: string }[]
}> => {
  const [roundingDownTakenBid, roundingUpTakenAsk] = [
    options?.roundingDownTakenBid ? options.roundingDownTakenBid : false,
    options?.roundingUpTakenAsk ? options.roundingUpTakenAsk : false,
  ]
  const publicClient = createPublicClient({
    chain: CHAIN_MAP[chainId],
    transport: options?.rpcUrl ? http(options.rpcUrl) : http(),
  })
  const market = await fetchMarket(
    publicClient,
    chainId,
    [inputToken, outputToken],
    !!(options && options.useSubgraph),
  )
  const isBid = isAddressEqual(market.quote.address, inputToken)
  const { roundingDownTick, roundingUpTick } =
    options && options.limitPrice
      ? parsePrice(
          Number(options.limitPrice),
          market.quote.decimals,
          market.base.decimals,
        )
      : isBid
        ? {
            roundingDownTick: MAX_TICK,
            roundingUpTick: MAX_TICK,
          }
        : {
            roundingDownTick: MIN_TICK,
            roundingUpTick: MIN_TICK,
          }
  const inputCurrency = isBid ? market.quote : market.base
  const isTakingBidSide = !isBid
  const { takenQuoteAmount, spentBaseAmount, bookId, events } = market.spend({
    spentBase: isTakingBidSide,
    limitTick: isTakingBidSide
      ? roundingDownTakenBid
        ? roundingDownTick
        : roundingUpTick
      : roundingUpTakenAsk
        ? roundingUpTick
        : roundingDownTick,
    amountIn: parseUnits(amountIn, inputCurrency.decimals),
  })
  return {
    takenAmount: formatUnits(
      takenQuoteAmount,
      isBid ? market.base.decimals : market.quote.decimals,
    ),
    spentAmount: formatUnits(
      spentBaseAmount,
      isBid ? market.quote.decimals : market.base.decimals,
    ),
    bookId,
    events: events.map(({ tick, takenQuoteAmount, spentBaseAmount }) => ({
      price: formatPrice(
        toPrice(isBid ? invertTick(BigInt(tick)) : BigInt(tick)),
        market.quote.decimals,
        market.base.decimals,
      ),
      takenAmount: formatUnits(
        takenQuoteAmount,
        isBid ? market.base.decimals : market.quote.decimals,
      ),
      spentAmount: formatUnits(
        spentBaseAmount,
        isBid ? market.quote.decimals : market.base.decimals,
      ),
    })),
  }
}

/**
 * Calculates the expected input for a given output amount, based on the provided market data.
 *
 * @param chainId The chain ID of the blockchain.
 * @param inputToken The address of the input token.
 * @param outputToken The address of the output token.
 * @param amountOut The amount of expected output amount. (ex 1.2 ETH -> 1.2)
 * @param options {@link DefaultReadContractOptions} options.
 * @param options.limitPrice The maximum limit price to take.
 * @param options.roundingDownTakenBid Whether to round down the taken bid.
 * @param options.roundingUpTakenAsk Whether to round up the taken ask.
 * @param options.useSubgraph Whether to use the subgraph to fetch the market data.
 * @returns A Promise resolving to an object containing the taken amount, spent amount and result of the calculation.
 * @example
 * import { getExpectedInput } from '@clober/v2-sdk'
 *
 * const { takenAmount, spentAmount } = await getExpectedInput({
 *   chainId: 421614,
 *   inputToken: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
 *   outputToken: '0x0000000000000000000000000000000000000000',
 *   amountOut: '0.1', // take 0.1 ETH
 * })
 */
export const getExpectedInput = async ({
  chainId,
  inputToken,
  outputToken,
  amountOut,
  options,
}: {
  chainId: CHAIN_IDS
  inputToken: `0x${string}`
  outputToken: `0x${string}`
  amountOut: string
  options?: {
    limitPrice?: string
    roundingDownTakenBid?: boolean
    roundingUpTakenAsk?: boolean
    useSubgraph?: boolean
  } & DefaultReadContractOptions
}): Promise<{
  takenAmount: string
  spentAmount: string
  bookId: bigint
  events: { price: string; takenAmount: string; spentAmount: string }[]
}> => {
  const [roundingDownTakenBid, roundingUpTakenAsk] = [
    options?.roundingDownTakenBid ? options.roundingDownTakenBid : false,
    options?.roundingUpTakenAsk ? options.roundingUpTakenAsk : false,
  ]
  const publicClient = createPublicClient({
    chain: CHAIN_MAP[chainId],
    transport: options?.rpcUrl ? http(options.rpcUrl) : http(),
  })
  const market = await fetchMarket(
    publicClient,
    chainId,
    [inputToken, outputToken],
    !!(options && options.useSubgraph),
  )
  const isBid = isAddressEqual(market.quote.address, inputToken)
  const { roundingDownTick, roundingUpTick } =
    options && options.limitPrice
      ? parsePrice(
          Number(options.limitPrice),
          market.quote.decimals,
          market.base.decimals,
        )
      : isBid
        ? { roundingDownTick: MAX_TICK, roundingUpTick: MAX_TICK }
        : { roundingDownTick: MIN_TICK, roundingUpTick: MIN_TICK }
  const outputCurrency = isBid ? market.base : market.quote
  const isTakingBidSide = !isBid
  const { takenQuoteAmount, spentBaseAmount, bookId, events } = market.take({
    takeQuote: isTakingBidSide,
    limitTick: isTakingBidSide
      ? roundingDownTakenBid
        ? roundingDownTick
        : roundingUpTick
      : roundingUpTakenAsk
        ? roundingUpTick
        : roundingDownTick,
    amountOut: parseUnits(amountOut, outputCurrency.decimals),
  })
  return {
    takenAmount: formatUnits(
      takenQuoteAmount,
      isBid ? market.base.decimals : market.quote.decimals,
    ),
    spentAmount: formatUnits(
      spentBaseAmount,
      isBid ? market.quote.decimals : market.base.decimals,
    ),
    bookId,
    events: events.map(({ tick, takenQuoteAmount, spentBaseAmount }) => ({
      price: formatPrice(
        toPrice(isBid ? invertTick(BigInt(tick)) : BigInt(tick)),
        market.quote.decimals,
        market.base.decimals,
      ),
      takenAmount: formatUnits(
        takenQuoteAmount,
        isBid ? market.base.decimals : market.quote.decimals,
      ),
      spentAmount: formatUnits(
        spentBaseAmount,
        isBid ? market.quote.decimals : market.base.decimals,
      ),
    })),
  }
}

/**
 * Retrieves the open order with the specified ID on the given chain.
 *
 * @param {CHAIN_IDS} chainId The chain ID.
 * @param {string} id The ID of the open order.
 * @param options {@link DefaultReadContractOptions} options.
 * @returns {Promise<OpenOrder>} Promise resolving to the open order object, or undefined if not found.
 * @example
 * import { getOpenOrder } from '@clober/v2-sdk'
 *
 * const openOrder = await getOpenOrder({
 *   chainId: 421614,
 *   id: '46223845323662364279893361453861711542636620039907198451770258805035840307200'
 * })
 */
export const getOpenOrder = async ({
  chainId,
  id,
}: {
  chainId: CHAIN_IDS
  id: string
}): Promise<OpenOrder> => {
  return fetchOpenOrderByOrderIdFromSubgraph(chainId, id)
}
/**
 * Retrieves open orders for the specified user on the given chain.
 *
 * @param {CHAIN_IDS} chainId The chain ID.
 * @param {`0x${string}`} userAddress The Ethereum address of the user.
 * @param options {@link DefaultReadContractOptions} options.
 * @returns {Promise<OpenOrder[]>} Promise resolving to an array of open orders.
 * @example
 * import { getOpenOrders } from '@clober/v2-sdk'
 *
 * const openOrders = await getOpenOrders({
 *   chainId: 421614,
 *   userAddress: '0x5F79EE8f8fA862E98201120d83c4eC39D9468D49'
 * })
 */
export const getOpenOrders = async ({
  chainId,
  userAddress,
}: {
  chainId: CHAIN_IDS
  userAddress: `0x${string}`
}): Promise<OpenOrder[]> => {
  return fetchOpenOrdersByUserAddressFromSubgraph(chainId, userAddress)
}

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

/**
 * Retrieves the quote token address for a given chain and a pair of tokens.
 *
 * @param chainId - chain id from {@link CHAIN_IDS}
 * @param token0 - token0 address
 * @param token1 - token1 address
 * @returns {string} The address of the quote token.
 *
 * @example
 * import { getQuoteToken } from '@clober/v2-sdk'
 *
 * const quote = await getQuoteToken({
 *   chainId: 421614,
 *   token0: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
 *   token1: '0x0000000000000000000000000000000000000000',
 * })
 */
export const getQuoteToken = ({
  chainId,
  token0,
  token1,
}: {
  chainId: CHAIN_IDS
  token0: `0x${string}`
  token1: `0x${string}`
}): `0x${string}` => {
  return getAddress(getMarketId(chainId, [token0, token1]).quoteTokenAddress)
}
