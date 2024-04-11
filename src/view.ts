import { formatUnits, isAddressEqual, parseUnits } from 'viem'

import { fetchMarket } from './apis/market'
import { CHAIN_IDS } from './constants/chain'
import { Market } from './type'
import { parsePrice } from './utils/prices'
import { MAX_PRICE } from './constants/price'
import { fetchOpenOrder, fetchOpenOrders } from './apis/open-order'
import { OpenOrder } from './model/open-order'

/**
 * Get market information by chain id and token addresses
 * @param chainId - chain id from {@link CHAIN_IDS}
 * @param token0 - token0 address
 * @param token1 - token1 address
 * @param options
 * @param options.rpcUrl - RPC URL of the blockchain
 * @returns A market {@link Market}
 *
 * @example
 * import { getMarket } from '@clober/v2-sdk'
 *
 * const market = await getMarket(
 *   421614,
 *  '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
 *  '0x0000000000000000000000000000000000000000',
 * )
 */
export const getMarket = async (
  chainId: CHAIN_IDS,
  token0: `0x${string}`,
  token1: `0x${string}`,
  options?: { rpcUrl?: string },
): Promise<Market> => {
  if (isAddressEqual(token0, token1)) {
    throw new Error('Token0 and token1 must be different')
  }
  const market = await fetchMarket(chainId, [token0, token1])
  return {
    chainId,
    quote: market.quote,
    base: market.base,
    makerFee: market.makerFee,
    takerFee: market.takerFee,
    bids: market.bids,
    bidBookOpen: market.bidBookOpen,
    asks: market.asks,
    askBookOpen: market.askBookOpen,
  }
}

/**
 * Calculates the expected output for a given input amount, based on the provided market data.
 *
 * @param chainId The chain ID of the blockchain.
 * @param inputToken The address of the input token.
 * @param outputToken The address of the output token.
 * @param amountIn The amount of expected input amount. (ex 1.2 ETH -> 1.2)
 * @param options
 * @param options.limitPrice The maximum limit price to spend.
 * @param options.rpcUrl The RPC URL of the blockchain.
 * @returns A Promise resolving to an object containing the taken amount, spend amount and result of the calculation.
 * @example
 * import { getExpectedOutput } from '@clober/v2-sdk'
 *
 * const { takenAmount, spendAmount } = await getExpectedOutput(
 *   421614,
 *  '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
 *  '0x0000000000000000000000000000000000000000',
 *  '1000.123', // spend 1000.123 USDC
 * )
 */
export const getExpectedOutput = async (
  chainId: CHAIN_IDS,
  inputToken: `0x${string}`,
  outputToken: `0x${string}`,
  amountIn: string,
  options?: { limitPrice?: string; rpcUrl?: string },
): Promise<{
  takenAmount: string
  spendAmount: string
  result: { bookId: bigint; takenAmount: bigint; spendAmount: bigint }[]
}> => {
  const market = await fetchMarket(chainId, [inputToken, outputToken])
  const isBid = isAddressEqual(market.quote.address, inputToken)
  const rawLimitPrice =
    options && options.limitPrice
      ? parsePrice(
          Number(options.limitPrice),
          market.quote.decimals,
          market.base.decimals,
        )
      : isBid
        ? MAX_PRICE
        : 0n
  const inputCurrency = isBid ? market.quote : market.base
  const result = market.spend({
    spendBase: !isBid,
    limitPrice: rawLimitPrice,
    amountIn: parseUnits(amountIn, inputCurrency.decimals),
  })
  const { takenAmount, spendAmount } = Object.values(result).reduce(
    (acc, { takenAmount, spendAmount }) => ({
      takenAmount: acc.takenAmount + takenAmount,
      spendAmount: acc.spendAmount + spendAmount,
    }),
    { takenAmount: 0n, spendAmount: 0n },
  )
  return {
    takenAmount: formatUnits(
      takenAmount,
      isBid ? market.base.decimals : market.quote.decimals,
    ),
    spendAmount: formatUnits(
      spendAmount,
      isBid ? market.quote.decimals : market.base.decimals,
    ),
    result: Object.entries(result).map(
      ([bookId, { takenAmount, spendAmount }]) => ({
        bookId: BigInt(bookId),
        takenAmount,
        spendAmount,
      }),
    ),
  }
}

/**
 * Calculates the expected input for a given output amount, based on the provided market data.
 *
 * @param chainId The chain ID of the blockchain.
 * @param inputToken The address of the input token.
 * @param outputToken The address of the output token.
 * @param amountOut The amount of expected output amount. (ex 1.2 ETH -> 1.2)
 * @param options
 * @param options.limitPrice The maximum limit price to take.
 * @param options.rpcUrl The RPC URL of the blockchain.
 * @returns A Promise resolving to an object containing the taken amount, spend amount and result of the calculation.
 * @example
 * import { getExpectedInput } from '@clober/v2-sdk'
 *
 * const { takenAmount, spendAmount } = await getExpectedInput(
 *   421614,
 *  '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
 *  '0x0000000000000000000000000000000000000000',
 *  '0.1', // take 0.1 ETH
 * )
 */
export const getExpectedInput = async (
  chainId: CHAIN_IDS,
  inputToken: `0x${string}`,
  outputToken: `0x${string}`,
  amountOut: string,
  options?: { limitPrice?: string; rpcUrl?: string },
): Promise<{
  takenAmount: string
  spendAmount: string
  result: { bookId: bigint; takenAmount: bigint; spendAmount: bigint }[]
}> => {
  const market = await fetchMarket(chainId, [inputToken, outputToken])
  const isBid = isAddressEqual(market.quote.address, inputToken)
  const rawLimitPrice =
    options && options.limitPrice
      ? parsePrice(
          Number(options.limitPrice),
          market.quote.decimals,
          market.base.decimals,
        )
      : isBid
        ? MAX_PRICE
        : 0n
  const outputCurrency = isBid ? market.base : market.quote
  const result = market.take({
    takeQuote: !isBid,
    limitPrice: rawLimitPrice,
    amountOut: parseUnits(amountOut, outputCurrency.decimals),
  })
  const { takenAmount, spendAmount } = Object.values(result).reduce(
    (acc, { takenAmount, spendAmount }) => ({
      takenAmount: acc.takenAmount + takenAmount,
      spendAmount: acc.spendAmount + spendAmount,
    }),
    { takenAmount: 0n, spendAmount: 0n },
  )
  return {
    takenAmount: formatUnits(
      takenAmount,
      isBid ? market.base.decimals : market.quote.decimals,
    ),
    spendAmount: formatUnits(
      spendAmount,
      isBid ? market.quote.decimals : market.base.decimals,
    ),
    result: Object.entries(result).map(
      ([bookId, { takenAmount, spendAmount }]) => ({
        bookId: BigInt(bookId),
        takenAmount,
        spendAmount,
      }),
    ),
  }
}

/**
 * Retrieves the open order with the specified ID on the given chain.
 *
 * @param {CHAIN_IDS} chainId The chain ID.
 * @param {string} id The ID of the open order.
 * @param options
 * @param options.rpcUrl The RPC URL of the blockchain.
 * @returns {Promise<OpenOrder>} Promise resolving to the open order object, or undefined if not found.
 * @example
 * import { getOpenOrder } from '@clober/v2-sdk'
 *
 * const openOrder = await getOpenOrder(
 *   421614,
 *  '46223845323662364279893361453861711542636620039907198451770258805035840307200'
 * )
 */
export const getOpenOrder = async (
  chainId: CHAIN_IDS,
  id: string,
  options?: { rpcUrl?: string },
): Promise<OpenOrder> => {
  return fetchOpenOrder(chainId, id, options?.rpcUrl)
}

/**
 * Retrieves open orders for the specified user on the given chain.
 *
 * @param {CHAIN_IDS} chainId The chain ID.
 * @param {`0x${string}`} userAddress The Ethereum address of the user.
 * @param options
 * @param options.rpcUrl The RPC URL of the blockchain.
 * @returns {Promise<OpenOrder[]>} Promise resolving to an array of open orders.
 * @example
 * import { getOpenOrders } from '@clober/v2-sdk'
 *
 * const openOrders = await getOpenOrders(
 *   421614,
 *  '0x5F79EE8f8fA862E98201120d83c4eC39D9468D49'
 * )
 */
export const getOpenOrders = async (
  chainId: CHAIN_IDS,
  userAddress: `0x${string}`,
  options?: { rpcUrl?: string },
): Promise<OpenOrder[]> => {
  return fetchOpenOrders(chainId, userAddress, options?.rpcUrl)
}
