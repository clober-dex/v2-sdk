import {
  createPublicClient,
  http,
  isAddressEqual,
  parseUnits,
  zeroAddress,
  zeroHash,
} from 'viem'

import { CHAIN_IDS, CHAIN_MAP } from '../../constants/chain-configs/chain'
import {
  CurrencyFlow,
  DefaultWriteContractOptions,
  ERC20PermitParam,
  Transaction,
} from '../../types'
import { fetchMarket } from '../../entities/market/apis'
import { getExpectedInput, getExpectedOutput } from '../../views'
import { buildTransaction } from '../../utils/build-transaction'
import { CONTRACT_ADDRESSES } from '../../constants/chain-configs/addresses'
import { CONTROLLER_ABI } from '../../constants/abis/core/controller-abi'
import { applyPercent } from '../../utils/bigint'
import { getDeadlineTimestampInSeconds } from '../../utils/time'

/**
 * Executes a market order on the specified chain for trading tokens.
 * If only `amountIn` is provided, spend the specified amount of input tokens.
 * If only `amountOut` is provided, take the specified amount of output tokens.
 *
 * @param {CHAIN_IDS} chainId The chain ID.
 * @param {`0x${string}`} userAddress The Ethereum address of the user placing the order.
 * @param {`0x${string}`} inputToken The address of the token to be used as input.
 * @param {`0x${string}`} outputToken The address of the token to be received as output.
 * @param {string} amountIn The amount of input tokens for the order to spend.
 * @param {string} amountOut The amount of output tokens for the order to take.
 * @param options {@link DefaultWriteContractOptions} options.
 * @param {erc20PermitParam} [options.erc20PermitParam] The permit signature for token approval.
 * @param {number} [options.slippage] The maximum slippage percentage allowed for the order.
 * @param {boolean} [options.roundingDownTakenBid] A boolean indicating whether to round down the taken bid.
 * @param {boolean} [options.roundingUpTakenAsk] A boolean indicating whether to round up the taken ask.
 * if the slippage is not provided, unlimited slippage is allowed.
 * @returns {Promise<{ transaction: Transaction, result: { spent: CurrencyFlow, taken: CurrencyFlow } }>}
 * Promise resolving to the transaction object representing the market order with the result of the order.
 * @example
 * import { marketOrder } from '@clober/v2-sdk'
 * import { privateKeyToAccount } from 'viem/accounts'
 *
 * const transaction = await marketOrder({
 *   chainId: 421614,
 *   userAddress: '0xF8c1869Ecd4df136693C45EcE1b67f85B6bDaE69
 *   inputToken: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
 *   outputToken: '0x0000000000000000000000000000000000000000',
 *   amount: '100.123', // 100.123 USDC
 *   options: { erc20PermitParam }
 * })
 *
 */
export const marketOrder = async ({
  chainId,
  userAddress,
  inputToken,
  outputToken,
  amountIn,
  amountOut,
  options,
}: {
  chainId: CHAIN_IDS
  userAddress: `0x${string}`
  inputToken: `0x${string}`
  outputToken: `0x${string}`
  amountIn?: string
  amountOut?: string
  options?: {
    erc20PermitParam?: ERC20PermitParam
    slippage?: number
    roundingDownTakenBid?: boolean
    roundingUpTakenAsk?: boolean
    useSubgraph?: boolean
  } & DefaultWriteContractOptions
}): Promise<{
  transaction: Transaction
  result: {
    taken: CurrencyFlow & {
      events: {
        price: string
        amount: string
      }[]
    }
    spent: CurrencyFlow & {
      events: {
        price: string
        amount: string
      }[]
    }
  }
}> => {
  if (!amountIn && !amountOut) {
    throw new Error('Either amountIn or amountOut must be provided')
  } else if (amountIn && amountOut) {
    throw new Error('Only one of amountIn or amountOut can be provided')
  }
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
  const isTakingBid = isAddressEqual(market.base.address, inputToken)
  const [inputCurrency, outputCurrency] = isTakingBid
    ? [market.base, market.quote]
    : [market.quote, market.base]
  if (
    (isTakingBid && !market.bidBook.isOpened) ||
    (!isTakingBid && !market.askBook.isOpened)
  ) {
    throw new Error(`
       Open the market before placing a market order.
       import { openMarket } from '@clober/v2-sdk'

       const transaction = await openMarket(
            ${chainId},
           '${inputToken}',
           '${outputToken}',
       )
    `)
  }
  const tokensToSettle = [inputToken, outputToken].filter(
    (address) => !isAddressEqual(address, zeroAddress),
  )
  const isETH = isAddressEqual(inputToken, zeroAddress)

  if (amountIn && !amountOut) {
    const { bookId, takenAmount, spentAmount, events } =
      await getExpectedOutput({
        chainId,
        inputToken,
        outputToken,
        amountIn,
        options: {
          ...options,
          // don't need to check limit price for market order
        },
      })
    const baseAmount = parseUnits(amountIn, inputCurrency.decimals)
    return {
      transaction: await buildTransaction(
        publicClient,
        {
          chain: CHAIN_MAP[chainId],
          account: userAddress,
          address: CONTRACT_ADDRESSES[chainId]!.Controller,
          abi: CONTROLLER_ABI,
          functionName: 'spend',
          args: [
            [
              {
                id: bookId,
                limitPrice: 0n,
                baseAmount,
                minQuoteAmount: options?.slippage
                  ? applyPercent(
                      parseUnits(takenAmount, outputCurrency.decimals),
                      100 - options.slippage,
                    )
                  : 0n,
                hookData: zeroHash,
              },
            ],
            tokensToSettle,
            options?.erc20PermitParam ? [options.erc20PermitParam] : [],
            getDeadlineTimestampInSeconds(),
          ],
          value: isETH ? baseAmount : 0n,
        },
        options?.gasLimit,
      ),
      result: {
        spent: {
          amount: spentAmount,
          currency: inputCurrency,
          direction: 'in',
          events: events.map(({ price, spentAmount }) => ({
            price,
            amount: spentAmount,
          })),
        },
        taken: {
          amount: takenAmount,
          currency: outputCurrency,
          direction: 'out',
          events: events.map(({ price, takenAmount }) => ({
            price,
            amount: takenAmount,
          })),
        },
      },
    }
  } else if (!amountIn && amountOut) {
    const { bookId, spentAmount, takenAmount, events } = await getExpectedInput(
      {
        chainId,
        inputToken,
        outputToken,
        amountOut,
        options: {
          ...options,
          // don't need to check limit price for market order
        },
      },
    )
    const quoteAmount = parseUnits(amountOut, outputCurrency.decimals)
    const baseAmount = parseUnits(spentAmount, inputCurrency.decimals)
    const maxBaseAmount =
      options?.erc20PermitParam?.permitAmount ??
      (options?.slippage
        ? applyPercent(baseAmount, 100 + options.slippage)
        : isETH
          ? baseAmount
          : 2n ** 256n - 1n)
    return {
      transaction: await buildTransaction(
        publicClient,
        {
          chain: CHAIN_MAP[chainId],
          account: userAddress,
          address: CONTRACT_ADDRESSES[chainId]!.Controller,
          abi: CONTROLLER_ABI,
          functionName: 'take',
          args: [
            [
              {
                id: bookId,
                limitPrice: 0n,
                quoteAmount,
                maxBaseAmount,
                hookData: zeroHash,
              },
            ],
            tokensToSettle,
            options?.erc20PermitParam ? [options.erc20PermitParam] : [],
            getDeadlineTimestampInSeconds(),
          ],
          value: isETH ? maxBaseAmount : 0n,
        },
        options?.gasLimit,
      ),
      result: {
        spent: {
          amount: spentAmount,
          currency: inputCurrency,
          direction: 'in',
          events: events.map(({ price, spentAmount }) => ({
            price,
            amount: spentAmount,
          })),
        },
        taken: {
          amount: takenAmount,
          currency: outputCurrency,
          direction: 'out',
          events: events.map(({ price, takenAmount }) => ({
            price,
            amount: takenAmount,
          })),
        },
      },
    }
  } else {
    throw new Error('Either amountIn or amountOut must be provided')
  }
}
