import {
  createPublicClient,
  formatUnits,
  http,
  isAddressEqual,
  parseUnits,
} from 'viem'

import { CHAIN_IDS, CHAIN_MAP } from '../../constants/chain-configs/chain'
import { DefaultReadContractOptions } from '../../types'
import { fetchMarket } from '../../entities/market/apis'
import { formatPrice, invertTick, parsePrice, toPrice } from '../../utils'
import { MAX_TICK, MIN_TICK } from '../../constants/tick'

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
