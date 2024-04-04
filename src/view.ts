import { formatUnits, isAddressEqual, parseUnits } from 'viem'

import { fetchMarket } from './apis/market'
import { CHAIN_IDS } from './constants/chain'
import { Market } from './type'
import { parsePrice } from './utils/prices'

/**
 * Get market information by chain id and token addresses
 * @param chainId - chain id from {@link CHAIN_IDS}
 * @param token0 - token0 address
 * @param token1 - token1 address
 * @returns A market {@link Market}
 *
 * @example
 * import { getMarket } from '@clober-dex/v2-sdk'
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
 * @returns A Promise resolving to an object containing the taken amount, spend amount and result of the calculation.
 * @example
 * import { getExpectedOutput } from '@clober-dex/v2-sdk'
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
  options?: { limitPrice?: string },
): Promise<{
  takenAmount: string
  spendAmount: string
  result: { bookId: bigint; takenAmount: bigint; spendAmount: bigint }[]
}> => {
  const market = await fetchMarket(chainId, [inputToken, outputToken])
  const isBid = isAddressEqual(market.quote.address, inputToken)
  const limitPrice =
    options?.limitPrice ?? (isBid ? (Math.pow(2, 256) - 1).toFixed(0) : '0')
  const inputCurrency = isBid ? market.quote : market.base
  const result = market.spend({
    spendBase: !isBid,
    limitPrice: parsePrice(
      Number(limitPrice),
      market.quote.decimals,
      market.base.decimals,
    ),
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
 * @returns A Promise resolving to an object containing the taken amount, spend amount and result of the calculation.
 * @example
 * import { getExpectedInput } from '@clober-dex/v2-sdk'
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
  options?: { limitPrice?: string },
): Promise<{
  takenAmount: string
  spendAmount: string
  result: { bookId: bigint; takenAmount: bigint; spendAmount: bigint }[]
}> => {
  const market = await fetchMarket(chainId, [inputToken, outputToken])
  const isBid = isAddressEqual(market.quote.address, inputToken)
  const limitPrice =
    options?.limitPrice ?? (isBid ? (Math.pow(2, 256) - 1).toFixed(0) : '0')
  const outputCurrency = isBid ? market.base : market.quote
  const result = market.take({
    takeQuote: !isBid,
    limitPrice: parsePrice(
      Number(limitPrice),
      market.quote.decimals,
      market.base.decimals,
    ),
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
