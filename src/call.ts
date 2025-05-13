import {
  createPublicClient,
  formatUnits,
  getAddress,
  http,
  isAddressEqual,
  parseUnits,
  zeroAddress,
  zeroHash,
} from 'viem'

import { CHAIN_IDS, CHAIN_MAP } from './constants/chain'
import type {
  Currency6909Flow,
  CurrencyFlow,
  DefaultWriteContractOptions,
  ERC20PermitParam,
  OpenOrder,
  Pool,
  Transaction,
} from './type'
import { calculateUnitSize } from './utils/unit-size'
import { CONTROLLER_ABI } from './abis/core/controller-abi'
import { getDeadlineTimestampInSeconds } from './utils/time'
import { buildTransaction } from './utils/build-transaction'
import { CONTRACT_ADDRESSES } from './constants/addresses'
import { MAKER_DEFAULT_POLICY, TAKER_DEFAULT_POLICY } from './constants/fee'
import {
  convertHumanReadablePriceToRawPrice,
  formatPrice,
  parsePrice,
} from './utils/prices'
import { invertTick, toPrice } from './utils/tick'
import { getExpectedInput, getExpectedOutput, getQuoteToken } from './view'
import { toBookId } from './entities/book/utils'
import { fetchIsApprovedForAll } from './apis/approval'
import { applyPercent } from './utils/bigint'
import { fetchPool } from './apis/pool'
import { REBALANCER_ABI } from './abis/rebalancer/rebalancer-abi'
import { getExpectedMintResult, getIdealDelta } from './utils/pool'
import { fetchCallData, fetchQuote } from './apis/odos'
import { MINTER_ABI } from './abis/rebalancer/minter-abi'
import { emptyERC20PermitParams } from './constants/permit'
import { abs } from './utils/math'
import { toBytes32 } from './utils/pool-key'
import { OPERATOR_ABI } from './abis/rebalancer/operator-abi'
import { STRATEGY_ABI } from './abis/rebalancer/strategy-abi'
import {
  fetchOnChainOrders,
  fetchOpenOrdersByOrderIdsFromSubgraph,
} from './entities/open-order/api'
import { OnChainOpenOrder } from './entities/open-order/model'
import { quotes } from './utils/quotes'
import { fetchMarket } from './entities/market/apis/market'

/**
 * Build a transaction to open a market.
 *
 * @param chainId The chain ID of the blockchain.
 * @param userAddress The address of the user.
 * @param inputToken The address of the input token.
 * @param outputToken The address of the output token.
 * @param options {@link DefaultWriteContractOptions} options.
 * @returns A Promise resolving to a transaction object. If the market is already open, returns undefined.
 * @example
 * import { openMarket } from '@clober/v2-sdk'
 *
 * const transaction = await openMarket({
 *   chainId: 421614,
 *   userAddress: '0xF8c1869Ecd4df136693C45EcE1b67f85B6bDaE69',
 *   inputToken: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
 *   outputToken: '0x0000000000000000000000000000000000000000'
 * })
 */
export const openMarket = async ({
  chainId,
  userAddress,
  inputToken,
  outputToken,
  options,
}: {
  chainId: CHAIN_IDS
  userAddress: `0x${string}`
  inputToken: `0x${string}`
  outputToken: `0x${string}`
  options?: DefaultWriteContractOptions & {
    useSubgraph?: boolean
  }
}): Promise<Transaction | undefined> => {
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
  if (
    (isBid && !market.bidBook.isOpened) ||
    (!isBid && !market.askBook.isOpened)
  ) {
    const unitSize = calculateUnitSize(
      chainId,
      isBid ? market.quote : market.base,
    )
    return buildTransaction(
      publicClient,
      {
        chain: CHAIN_MAP[chainId],
        address: CONTRACT_ADDRESSES[chainId]!.Controller,
        account: userAddress,
        abi: CONTROLLER_ABI,
        functionName: 'open',
        args: [
          [
            {
              key: {
                base: outputToken,
                unitSize,
                quote: inputToken,
                makerPolicy: MAKER_DEFAULT_POLICY[chainId].value,
                hooks: zeroAddress,
                takerPolicy: TAKER_DEFAULT_POLICY[chainId].value,
              },
              hookData: zeroHash,
            },
          ],
          getDeadlineTimestampInSeconds(),
        ],
      },
      options?.gasLimit,
    )
  }
  return undefined
}

/**
 * Places a limit order on the specified chain for trading tokens.
 *
 * @param {CHAIN_IDS} chainId The chain ID.
 * @param {`0x${string}`} userAddress The Ethereum address of the user placing the order.
 * @param {`0x${string}`} inputToken The address of the token to be used as input.
 * @param {`0x${string}`} outputToken The address of the token to be received as output.
 * @param {string} amount The amount of input tokens for the order.
 * @param {string} price The price at which the order should be executed.
 * @param options {@link DefaultWriteContractOptions} options.
 * @param {erc20PermitParam} [options.erc20PermitParam] The permit signature for token approval.
 * @param {boolean} [options.postOnly] A boolean indicating whether the order is only to be made not taken.
 * @param {bigint} [options.makeTick] The tick for the make order.
 * @param {bigint} [options.takeLimitTick] The tick for the take order.
 * @param {boolean} [options.roundingUpMakeBid] A boolean indicating whether to round up the make bid.
 * @param {boolean} [options.roundingDownMakeAsk] A boolean indicating whether to round down the make ask.
 * @param {boolean} [options.roundingDownTakenBid] A boolean indicating whether to round down the taken bid.
 * @param {boolean} [options.roundingUpTakenAsk] A boolean indicating whether to round up the taken ask.
 * @returns {Promise<{ transaction: Transaction, result: { make: CurrencyFlow, take: CurrencyFlow, spent: CurrencyFlow }>}
 * Promise resolving to the transaction object representing the limit order with the result of the order.
 * @example
 * import { limitOrder } from '@clober/v2-sdk'
 * import { privateKeyToAccount } from 'viem/accounts'
 *
 * const { transaction } = await limitOrder({
 *   chainId: 421614,
 *   userAddress: '0xF8c1869Ecd4df136693C45EcE1b67f85B6bDaE69
 *   inputToken: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
 *   outputToken: '0x0000000000000000000000000000000000000000',
 *   amount: '100.123', // 100.123 USDC
 *   price: '4000.01', // price at 4000.01 (ETH/USDC)
 * })
 *
 * @example
 * import { limitOrder } from '@clober/v2-sdk'
 *
 * const { transaction } = await limitOrder({
 *   chainId: 421614,
 *   userAddress: '0xF8c1869Ecd4df136693C45EcE1b67f85B6bDaE69
 *   inputToken: '0x0000000000000000000000000000000000000000',
 *   outputToken: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
 *   amount: '0.13', // 0.13 ETH
 *   price: '4000.01', // price at 4000.01 (ETH/USDC)
 * })
 */
export const limitOrder = async ({
  chainId,
  userAddress,
  inputToken,
  outputToken,
  amount,
  price,
  options,
}: {
  chainId: CHAIN_IDS
  userAddress: `0x${string}`
  inputToken: `0x${string}`
  outputToken: `0x${string}`
  amount: string
  price: string
  options?: {
    erc20PermitParam?: ERC20PermitParam
    postOnly?: boolean
    makeTick?: bigint
    takeLimitTick?: bigint
    roundingUpMakeBid?: boolean
    roundingDownMakeAsk?: boolean
    roundingDownTakenBid?: boolean
    roundingUpTakenAsk?: boolean
    useSubgraph?: boolean
  } & DefaultWriteContractOptions
}): Promise<{
  transaction: Transaction
  result: {
    make: CurrencyFlow & { price: string }
    taken: CurrencyFlow & { events: { price: string; amount: string }[] }
    spent: CurrencyFlow & { events: { price: string; amount: string }[] }
  }
}> => {
  const [
    roundingUpMakeBid,
    roundingDownMakeAsk,
    roundingDownTakenBid,
    roundingUpTakenAsk,
  ] = [
    options?.roundingUpMakeBid ? options.roundingUpMakeBid : false,
    options?.roundingDownMakeAsk ? options.roundingDownMakeAsk : false,
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
  const [inputCurrency, outputCurrency] = isBid
    ? [market.quote, market.base]
    : [market.base, market.quote]
  if (
    (isBid && !market.bidBook.isOpened) ||
    (!isBid && !market.askBook.isOpened)
  ) {
    throw new Error(`
       Open the market before placing a limit order.
       import { openMarket } from '@clober/v2-sdk'

       const transaction = await openMarket({
            chainId: ${chainId},
            inputToken: '${inputToken}',
            outputToken: '${outputToken}',
       })
    `)
  }

  const { roundingDownTick, roundingUpTick } = parsePrice(
    Number(price),
    market.quote.decimals,
    market.base.decimals,
  )
  const tokensToSettle = [inputToken, outputToken].filter(
    (address) => !isAddressEqual(address, zeroAddress),
  )
  const quoteAmount = parseUnits(amount, inputCurrency.decimals)
  const unitSize = calculateUnitSize(chainId, inputCurrency)
  const { takenAmount, spentAmount, bookId, events } = await getExpectedOutput({
    chainId,
    inputToken,
    outputToken,
    amountIn: amount,
    options: {
      ...options,
      limitPrice: price,
    },
  })
  const isETH = isAddressEqual(inputToken, zeroAddress)
  const makeParam = {
    id: toBookId(chainId, inputToken, outputToken, unitSize),
    tick: options?.makeTick
      ? Number(options.makeTick)
      : Number(
          isBid
            ? roundingUpMakeBid
              ? roundingUpTick
              : roundingDownTick
            : invertTick(
                roundingDownMakeAsk ? roundingDownTick : roundingUpTick,
              ),
        ),
    quoteAmount,
    hookData: zeroHash,
  }
  if (options?.postOnly === true || spentAmount === '0') {
    return {
      transaction: await buildTransaction(
        publicClient,
        {
          chain: CHAIN_MAP[chainId],
          account: userAddress,
          address: CONTRACT_ADDRESSES[chainId]!.Controller,
          abi: CONTROLLER_ABI,
          functionName: 'make',
          args: [
            [makeParam],
            tokensToSettle,
            options?.erc20PermitParam ? [options.erc20PermitParam] : [],
            getDeadlineTimestampInSeconds(),
          ],
          value: isETH ? quoteAmount : 0n,
        },
        options?.gasLimit,
      ),
      result: {
        make: {
          amount: formatUnits(quoteAmount, inputCurrency.decimals),
          currency: inputCurrency,
          direction: 'in',
          price: formatPrice(
            isBid
              ? toPrice(BigInt(makeParam.tick))
              : toPrice(invertTick(BigInt(makeParam.tick))),
            market.quote.decimals,
            market.base.decimals,
          ),
        },
        spent: {
          amount: '0',
          currency: inputCurrency,
          direction: 'in',
          events: [],
        },
        taken: {
          amount: '0',
          currency: outputCurrency,
          direction: 'out',
          events: [],
        },
      },
    }
  } else {
    // take and make
    return {
      transaction: await buildTransaction(
        publicClient,
        {
          chain: CHAIN_MAP[chainId],
          account: userAddress,
          address: CONTRACT_ADDRESSES[chainId]!.Controller,
          abi: CONTROLLER_ABI,
          functionName: 'limit',
          args: [
            [
              {
                takeBookId: bookId,
                makeBookId: makeParam.id,
                limitPrice: options?.takeLimitTick
                  ? toPrice(options.takeLimitTick)
                  : toPrice(
                      isBid
                        ? invertTick(
                            roundingUpTakenAsk
                              ? roundingUpTick
                              : roundingDownTick,
                          )
                        : roundingDownTakenBid
                          ? roundingDownTick
                          : roundingUpTick,
                    ),
                tick: makeParam.tick,
                quoteAmount,
                takeHookData: zeroHash,
                makeHookData: makeParam.hookData,
              },
            ],
            tokensToSettle,
            options?.erc20PermitParam ? [options.erc20PermitParam] : [],
            getDeadlineTimestampInSeconds(),
          ],
          value: isETH ? quoteAmount : 0n,
        },
        options?.gasLimit,
      ),
      result: {
        make: {
          amount: formatUnits(
            quoteAmount - parseUnits(spentAmount, inputCurrency.decimals),
            inputCurrency.decimals,
          ),
          currency: inputCurrency,
          direction: 'in',
          price: formatPrice(
            isBid
              ? toPrice(BigInt(makeParam.tick))
              : toPrice(invertTick(BigInt(makeParam.tick))),
            market.quote.decimals,
            market.base.decimals,
          ),
        },
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
  }
}

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

/**
 * Claims specified open order for settlement.
 * [IMPORTANT] Set ApprovalForAll before calling this function.
 *
 * @param {CHAIN_IDS} chainId The chain ID.
 * @param {`0x${string}`} userAddress The Ethereum address of the user.
 * @param {string} id An ID representing the open order to be claimed.
 * @param options {@link DefaultWriteContractOptions} options.
 * @returns {Promise<{ transaction: Transaction, result: CurrencyFlow }>}
 * Promise resolving to the transaction object representing the claim action with the result of the order.
 * @throws {Error} Throws an error if no open orders are found for the specified user.
 * @example
 * import { getOpenOrders, claimOrders } from '@clober/v2-sdk'
 *
 * const openOrders = await getOpenOrders({
 *     chainId: 421614,
 *     userAddress: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0'
 * })
 * const transaction = await claimOrders({
 *    chainId: 421614,
 *    userAddress: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
 *    id: openOrders.map((order) => order.id)
 * })
 */
export const claimOrder = async ({
  chainId,
  userAddress,
  id,
  options,
}: {
  chainId: CHAIN_IDS
  userAddress: `0x${string}`
  id: string
  options?: DefaultWriteContractOptions & {
    useSubgraph?: boolean
  }
}): Promise<{ transaction: Transaction; result: CurrencyFlow }> => {
  const { transaction, result } = await claimOrders({
    chainId,
    userAddress,
    ids: [id],
    options: { ...options },
  })
  return {
    transaction,
    result: result[0],
  }
}

/**
 * Claims specified open orders for settlement.
 * [IMPORTANT] Set ApprovalForAll before calling this function.
 *
 * @param {CHAIN_IDS} chainId The chain ID.
 * @param {`0x${string}`} userAddress The Ethereum address of the user.
 * @param {string[]} ids An array of IDs representing the open orders to be claimed.
 * @param options {@link DefaultWriteContractOptions} options.
 * @returns {Promise<{ transaction: Transaction, result: CurrencyFlow[] }>}
 * Promise resolving to the transaction object representing the claim action with the result of the orders.
 * @throws {Error} Throws an error if no open orders are found for the specified user.
 * @example
 * import { getOpenOrders, claimOrders } from '@clober/v2-sdk'
 *
 * const openOrders = await getOpenOrders({
 *     chainId: 421614,
 *     userAddress: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0'
 * })
 * const transaction = await claimOrders(
 *    chainId: 421614,
 *    userAddress: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
 *    ids: openOrders.map((order) => order.id)
 * )
 */
export const claimOrders = async ({
  chainId,
  userAddress,
  ids,
  options,
}: {
  chainId: CHAIN_IDS
  userAddress: `0x${string}`
  ids: string[]
  options?: DefaultWriteContractOptions & {
    useSubgraph?: boolean
  }
}): Promise<{ transaction: Transaction; result: CurrencyFlow[] }> => {
  const publicClient = createPublicClient({
    chain: CHAIN_MAP[chainId],
    transport: options?.rpcUrl ? http(options.rpcUrl) : http(),
  })
  const isApprovedForAll = await fetchIsApprovedForAll(
    publicClient,
    chainId,
    userAddress,
  )
  if (!isApprovedForAll) {
    throw new Error(`
       Set ApprovalForAll before calling this function.
       import { setApprovalOfOpenOrdersForAll } from '@clober/v2-sdk'

       const hash = await setApprovalOfOpenOrdersForAll({
            chainId: ${chainId},
            walletClient, // use viem
       })
    `)
  }

  const useSubgraph = !!(options && options.useSubgraph)
  const orders: (OpenOrder | OnChainOpenOrder)[] = (
    useSubgraph
      ? await fetchOpenOrdersByOrderIdsFromSubgraph(chainId, ids)
      : await fetchOnChainOrders(
          publicClient,
          chainId,
          ids.map((id) => BigInt(id)),
        )
  ).filter(
    (order) =>
      isAddressEqual(order.user, userAddress) && order.claimable.value !== '0',
  )
  const tokensToSettle = orders
    .map((order) => [order.inputCurrency.address, order.outputCurrency.address])
    .flat()
    .filter(
      (address, index, self) =>
        self.findIndex((c) => isAddressEqual(c, address)) === index,
    )
    .filter((address) => !isAddressEqual(address, zeroAddress))

  return {
    transaction: await buildTransaction(
      publicClient,
      {
        chain: CHAIN_MAP[chainId],
        account: userAddress,
        address: CONTRACT_ADDRESSES[chainId]!.Controller,
        abi: CONTROLLER_ABI,
        functionName: 'claim',
        args: [
          orders.map(({ id }) => ({
            id,
            hookData: zeroHash,
          })),
          tokensToSettle,
          [],
          getDeadlineTimestampInSeconds(),
        ],
      },
      options?.gasLimit,
    ),
    result: orders.reduce((acc, { claimable: { currency, value } }) => {
      const index = acc.findIndex((c) =>
        isAddressEqual(c.currency.address, currency.address),
      )
      if (index === -1) {
        return [...acc, { currency, amount: value, direction: 'out' }]
      }
      acc[index].amount = (Number(acc[index].amount) + Number(value)).toString()
      return acc
    }, [] as CurrencyFlow[]),
  }
}

/**
 * Cancels specified open order if the order is not fully filled.
 * [IMPORTANT] Set ApprovalForAll before calling this function.
 *
 * @param {CHAIN_IDS} chainId The chain ID.
 * @param {`0x${string}`} userAddress The Ethereum address of the user.
 * @param {string} id An ID representing the open order to be canceled
 * @param options {@link DefaultWriteContractOptions} options.
 * @returns {Promise<{ transaction: Transaction, result: CurrencyFlow }>}
 * Promise resolving to the transaction object representing the cancel action with the result of the order.
 * @throws {Error} Throws an error if no open orders are found for the specified user.
 * @example
 * import { getOpenOrders, cancelOrders } from '@clober/v2-sdk'
 *
 * const openOrders = await getOpenOrders({
 *     chainId: 421614,
 *     userAddress:'0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0'
 * })
 * const transaction = await cancelOrders({
 *    chainId: 421614,
 *    userAddress: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
 *    id: openOrders.map((order) => order.id)
 * })
 */
export const cancelOrder = async ({
  chainId,
  userAddress,
  id,
  options,
}: {
  chainId: CHAIN_IDS
  userAddress: `0x${string}`
  id: string
  options?: DefaultWriteContractOptions & {
    useSubgraph?: boolean
  }
}): Promise<{ transaction: Transaction; result: CurrencyFlow }> => {
  const { transaction, result } = await cancelOrders({
    chainId,
    userAddress,
    ids: [id],
    options: { ...options },
  })
  return {
    transaction,
    result: result[0],
  }
}

/**
 * Cancels specified open orders if orders are not fully filled.
 * [IMPORTANT] Set ApprovalForAll before calling this function.
 *
 * @param {CHAIN_IDS} chainId The chain ID.
 * @param {`0x${string}`} userAddress The Ethereum address of the user.
 * @param {string[]} ids An array of IDs representing the open orders to be canceled.
 * @param options {@link DefaultWriteContractOptions} options.
 * @returns {Promise<{ transaction: Transaction, result: CurrencyFlow[] }>
 * Promise resolving to the transaction object representing the cancel action with the result of the orders.
 * @throws {Error} Throws an error if no open orders are found for the specified user.
 * @example
 * import { getOpenOrders, cancelOrders } from '@clober/v2-sdk'
 *
 * const openOrders = await getOpenOrders({
 *     chainId: 421614,
 *     userAddress: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0'
 * })
 * const transaction = await cancelOrders({
 *    chainId: 421614,
 *    userAddress: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
 *    ids: openOrders.map((order) => order.id)
 * })
 */
export const cancelOrders = async ({
  chainId,
  userAddress,
  ids,
  options,
}: {
  chainId: CHAIN_IDS
  userAddress: `0x${string}`
  ids: string[]
  options?: DefaultWriteContractOptions & {
    useSubgraph?: boolean
  }
}): Promise<{ transaction: Transaction; result: CurrencyFlow[] }> => {
  const publicClient = createPublicClient({
    chain: CHAIN_MAP[chainId],
    transport: options?.rpcUrl ? http(options.rpcUrl) : http(),
  })
  const isApprovedForAll = await fetchIsApprovedForAll(
    publicClient,
    chainId,
    userAddress,
  )
  if (!isApprovedForAll) {
    throw new Error(`
       Set ApprovalForAll before calling this function.
       import { setApprovalOfOpenOrdersForAll } from '@clober/v2-sdk'

       const hash = await setApprovalOfOpenOrdersForAll({
            chainId: ${chainId},
            walletClient, // use viem
       })
    `)
  }

  const useSubgraph = !!(options && options.useSubgraph)
  const orders: (OpenOrder | OnChainOpenOrder)[] = (
    useSubgraph
      ? await fetchOpenOrdersByOrderIdsFromSubgraph(chainId, ids)
      : await fetchOnChainOrders(
          publicClient,
          chainId,
          ids.map((id) => BigInt(id)),
        )
  ).filter(
    (order) =>
      isAddressEqual(order.user, userAddress) && order.cancelable.value !== '0',
  )
  const tokensToSettle = orders
    .map((order) => [order.inputCurrency.address, order.outputCurrency.address])
    .flat()
    .filter(
      (address, index, self) =>
        self.findIndex((c) => isAddressEqual(c, address)) === index,
    )
    .filter((address) => !isAddressEqual(address, zeroAddress))

  return {
    transaction: await buildTransaction(
      publicClient,
      {
        chain: CHAIN_MAP[chainId],
        account: userAddress,
        address: CONTRACT_ADDRESSES[chainId]!.Controller,
        abi: CONTROLLER_ABI,
        functionName: 'cancel',
        args: [
          orders.map(({ id }) => ({
            id,
            leftQuoteAmount: 0n,
            hookData: zeroHash,
          })),
          tokensToSettle,
          [],
          getDeadlineTimestampInSeconds(),
        ],
      },
      options?.gasLimit,
    ),
    result: orders.reduce((acc, { cancelable: { currency, value } }) => {
      const index = acc.findIndex((c) =>
        isAddressEqual(c.currency.address, currency.address),
      )
      if (index === -1) {
        return [...acc, { currency, amount: value, direction: 'out' }]
      }
      acc[index].amount = (Number(acc[index].amount) + Number(value)).toString()
      return acc
    }, [] as CurrencyFlow[]),
  }
}

/**
 * Build a transaction to open a pool,
 *
 * @param chainId The chain ID of the blockchain.
 * @param userAddress The address of the user.
 * @param inputToken The address of the input token.
 * @param outputToken The address of the output token.
 * @param options {@link DefaultWriteContractOptions} options.
 * @returns A Promise resolving to a transaction object. If the market is already open, returns undefined.
 * @example
 * import { openPool } from '@clober/v2-sdk'
 *
 * const transaction = await openPool({
 *   chainId: 421614,
 *   userAddress: '0xF8c1869Ecd4df136693C45EcE1b67f85B6bDaE69',
 *   inputToken: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
 *   outputToken: '0x0000000000000000000000000000000000000000',
 *   salt: '0x0000000000000000000000000000000000000000000000000000000000000000',
 * })
 */
export const openPool = async ({
  chainId,
  userAddress,
  tokenA,
  tokenB,
  salt,
  options,
}: {
  chainId: CHAIN_IDS
  userAddress: `0x${string}`
  tokenA: `0x${string}`
  tokenB: `0x${string}`
  salt: `0x${string}`
  options?: DefaultWriteContractOptions & {
    useSubgraph?: boolean
  }
}): Promise<Transaction | undefined> => {
  const publicClient = createPublicClient({
    chain: CHAIN_MAP[chainId],
    transport: options?.rpcUrl ? http(options.rpcUrl) : http(),
  })
  const pool = await fetchPool(
    publicClient,
    chainId,
    [tokenA, tokenB],
    salt,
    !!(options && options.useSubgraph),
  )
  if (!pool.isOpened) {
    return buildTransaction(
      publicClient,
      {
        chain: CHAIN_MAP[chainId],
        address: CONTRACT_ADDRESSES[chainId]!.Rebalancer,
        account: userAddress,
        abi: REBALANCER_ABI,
        functionName: 'open',
        args: [
          {
            base: pool.market.bidBook.base.address,
            unitSize: pool.market.bidBook.unitSize,
            quote: pool.market.bidBook.quote.address,
            makerPolicy: MAKER_DEFAULT_POLICY[chainId].value,
            hooks: zeroAddress,
            takerPolicy: TAKER_DEFAULT_POLICY[chainId].value,
          },
          {
            base: pool.market.askBook.base.address,
            unitSize: pool.market.askBook.unitSize,
            quote: pool.market.askBook.quote.address,
            makerPolicy: MAKER_DEFAULT_POLICY[chainId].value,
            hooks: zeroAddress,
            takerPolicy: TAKER_DEFAULT_POLICY[chainId].value,
          },
          toBytes32(salt),
          CONTRACT_ADDRESSES[chainId]!.Strategy,
        ],
      },
      options?.gasLimit,
    )
  }
  return undefined
}

export const addLiquidity = async ({
  chainId,
  userAddress,
  token0,
  token1,
  salt,
  amount0,
  amount1,
  options,
}: {
  chainId: CHAIN_IDS
  userAddress: `0x${string}`
  token0: `0x${string}`
  token1: `0x${string}`
  salt: `0x${string}`
  amount0?: string
  amount1?: string
  options?: {
    slippage?: number
    disableSwap?: boolean
    token0PermitParams?: ERC20PermitParam
    token1PermitParams?: ERC20PermitParam
    token0Price?: number
    token1Price?: number
    testnetPrice?: number
    useSubgraph?: boolean
  } & DefaultWriteContractOptions
}): Promise<{
  transaction: Transaction | undefined
  result: {
    currencyA: CurrencyFlow
    currencyB: CurrencyFlow
    lpCurrency: Currency6909Flow
  }
}> => {
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
  )
  if (!pool.isOpened) {
    throw new Error(`
       Open the pool before adding liquidity.
       import { openPool } from '@clober/v2-sdk'

       const transaction = await openPool({
            chainId: ${chainId},
            tokenA: '${token0}',
            tokenB: '${token1}',
            salt: '0x0000000000000000000000000000000000000000000000000000000000000000',
       })
    `)
  }
  const [amountAOrigin, amountBOrigin] = isAddressEqual(
    pool.currencyA.address,
    getAddress(token0),
  )
    ? [
        parseUnits(amount0 ?? '0', pool.currencyA.decimals),
        parseUnits(amount1 ?? '0', pool.currencyB.decimals),
      ]
    : [
        parseUnits(amount1 ?? '0', pool.currencyA.decimals),
        parseUnits(amount0 ?? '0', pool.currencyB.decimals),
      ]
  let [amountA, amountB] = [amountAOrigin, amountBOrigin]
  const tokenAPermitParams = isAddressEqual(
    pool.currencyA.address,
    getAddress(token0),
  )
    ? options?.token0PermitParams ?? emptyERC20PermitParams
    : options?.token1PermitParams ?? emptyERC20PermitParams
  const tokenBPermitParams = isAddressEqual(
    pool.currencyA.address,
    getAddress(token0),
  )
    ? options?.token1PermitParams ?? emptyERC20PermitParams
    : options?.token0PermitParams ?? emptyERC20PermitParams
  let disableSwap = !!(options && options.disableSwap)
  if (
    pool.totalSupply === 0n ||
    (pool.liquidityA === 0n && pool.liquidityB === 0n)
  ) {
    disableSwap = true
  }
  const slippageLimitPercent = options?.slippage ?? 1.0

  const swapParams: {
    inCurrency: `0x${string}`
    amount: bigint
    data: string
  } = {
    inCurrency: zeroAddress,
    amount: 0n,
    data: '0x',
  }

  if (!disableSwap) {
    const currencyBPerCurrencyA = options?.testnetPrice
      ? isAddressEqual(
          getQuoteToken({
            chainId,
            token0,
            token1,
          }),
          pool.currencyA.address,
        )
        ? 1 / Number(options.testnetPrice)
        : Number(options.testnetPrice)
      : undefined
    const swapAmountA = parseUnits('1', pool.currencyA.decimals)
    let swapAmountB = -1n
    if (options && options.token0Price && options.token1Price) {
      const tokenAPrice = isAddressEqual(
        pool.currencyA.address,
        getAddress(token0),
      )
        ? options.token0Price
        : options.token1Price
      const tokenBPrice = isAddressEqual(
        pool.currencyA.address,
        getAddress(token0),
      )
        ? options.token1Price
        : options.token0Price
      swapAmountB = quotes(
        swapAmountA,
        tokenAPrice,
        tokenBPrice,
        pool.currencyA.decimals,
        pool.currencyB.decimals,
      )
    } else {
      ;({ amountOut: swapAmountB } = await fetchQuote({
        chainId,
        amountIn: swapAmountA,
        tokenIn: pool.currencyA,
        tokenOut: pool.currencyB,
        slippageLimitPercent: 1,
        userAddress: CONTRACT_ADDRESSES[chainId]!.Minter,
        testnetPrice: currencyBPerCurrencyA,
      }))
    }
    if (swapAmountB === -1n) {
      throw new Error('Failed to fetch quote')
    }
    const { deltaA, deltaB } = getIdealDelta(
      amountA,
      amountB,
      pool.liquidityA,
      pool.liquidityB,
      swapAmountA,
      swapAmountB,
    )

    if (deltaA < 0n) {
      swapParams.inCurrency = pool.currencyA.address
      swapParams.amount = -deltaA
      const { amountOut: actualDeltaB, data: calldata } = await fetchCallData({
        chainId,
        amountIn: swapParams.amount,
        tokenIn: pool.currencyA,
        tokenOut: pool.currencyB,
        slippageLimitPercent,
        userAddress: CONTRACT_ADDRESSES[chainId]!.Minter,
        testnetPrice: currencyBPerCurrencyA,
      })
      swapParams.data = calldata
      amountA += deltaA
      amountB += actualDeltaB
    } else if (deltaB < 0n) {
      swapParams.inCurrency = pool.currencyB.address
      swapParams.amount = -deltaB
      const { amountOut: actualDeltaA, data: calldata } = await fetchCallData({
        chainId,
        amountIn: swapParams.amount,
        tokenIn: pool.currencyB,
        tokenOut: pool.currencyA,
        slippageLimitPercent,
        userAddress: CONTRACT_ADDRESSES[chainId]!.Minter,
        testnetPrice: currencyBPerCurrencyA
          ? 1 / currencyBPerCurrencyA
          : undefined,
      })
      swapParams.data = calldata
      amountA += actualDeltaA
      amountB += deltaB
    }
  }

  const { mintAmount, inAmountA, inAmountB } = getExpectedMintResult(
    pool.totalSupply,
    pool.liquidityA,
    pool.liquidityB,
    amountA,
    amountB,
    pool.currencyA,
    pool.currencyB,
  )

  if (mintAmount === 0n) {
    return {
      transaction: undefined,
      result: {
        currencyA: {
          currency: pool.currencyA,
          amount: '0',
          direction: 'in',
        },
        currencyB: {
          currency: pool.currencyB,
          amount: '0',
          direction: 'in',
        },
        lpCurrency: {
          currency: pool.currencyLp,
          amount: '0',
          direction: 'out',
        },
      },
    }
  }

  const minMintAmount = applyPercent(mintAmount, 100 - slippageLimitPercent)

  const transaction = await buildTransaction(
    publicClient,
    {
      chain: CHAIN_MAP[chainId],
      account: userAddress,
      address: CONTRACT_ADDRESSES[chainId]!.Minter,
      abi: MINTER_ABI,
      functionName: 'mint',
      args: [
        pool.key,
        amountAOrigin,
        amountBOrigin,
        minMintAmount,
        {
          permitAmount: tokenAPermitParams.permitAmount,
          signature: tokenAPermitParams.signature,
        },
        {
          permitAmount: tokenBPermitParams.permitAmount,
          signature: tokenBPermitParams.signature,
        },
        swapParams,
      ],
      value: isAddressEqual(token0, zeroAddress)
        ? amountAOrigin
        : isAddressEqual(token1, zeroAddress)
          ? amountBOrigin
          : undefined,
    },
    options?.gasLimit,
  )

  const currencyARefund = amountA - inAmountA
  const currencyBRefund = amountB - inAmountB
  const currencyAResultAmount = amountAOrigin - currencyARefund
  const currencyBResultAmount = amountBOrigin - currencyBRefund

  return {
    transaction,
    result: {
      currencyA: {
        currency: pool.currencyA,
        amount: formatUnits(
          abs(currencyAResultAmount),
          pool.currencyA.decimals,
        ),
        direction: currencyAResultAmount >= 0 ? 'in' : 'out',
      },
      currencyB: {
        currency: pool.currencyB,
        amount: formatUnits(
          abs(currencyBResultAmount),
          pool.currencyB.decimals,
        ),
        direction: currencyBResultAmount >= 0 ? 'in' : 'out',
      },
      lpCurrency: {
        currency: pool.currencyLp,
        amount: formatUnits(mintAmount, pool.currencyLp.decimals),
        direction: 'out',
      },
    },
  }
}

// @dev: Withdraw amount calculation logic is based on the contract code.
export const removeLiquidity = async ({
  chainId,
  userAddress,
  token0,
  token1,
  salt,
  amount,
  options,
}: {
  chainId: CHAIN_IDS
  userAddress: `0x${string}`
  token0: `0x${string}`
  token1: `0x${string}`
  salt: `0x${string}`
  amount: string
  options?: {
    slippage?: number
    useSubgraph?: boolean
  } & DefaultWriteContractOptions
}): Promise<{
  transaction: Transaction | undefined
  result: {
    currencyA: CurrencyFlow
    currencyB: CurrencyFlow
    lpCurrency: Currency6909Flow
  }
}> => {
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
  )
  if (!pool.isOpened) {
    throw new Error(`
       Open the pool before removing liquidity.
       import { openPool } from '@clober/v2-sdk'

       const transaction = await openPool({
            chainId: ${chainId},
            tokenA: '${token0}',
            tokenB: '${token1}',
            salt: '0x0000000000000000000000000000000000000000000000000000000000000000',
       })
    `)
  }
  const burnAmount = parseUnits(amount, pool.currencyLp.decimals)
  const slippageLimitPercent = options?.slippage ?? 2
  const withdrawAmountA = (burnAmount * pool.liquidityA) / pool.totalSupply
  const withdrawAmountB = (burnAmount * pool.liquidityB) / pool.totalSupply
  const minWithdrawAmountA = applyPercent(
    withdrawAmountA,
    100 - slippageLimitPercent,
  )
  const minWithdrawAmountB = applyPercent(
    withdrawAmountB,
    100 - slippageLimitPercent,
  )

  if (burnAmount === 0n) {
    return {
      transaction: undefined,
      result: {
        currencyA: {
          currency: pool.currencyA,
          amount: '0',
          direction: 'out',
        },
        currencyB: {
          currency: pool.currencyB,
          amount: '0',
          direction: 'out',
        },
        lpCurrency: {
          currency: pool.currencyLp,
          amount: '0',
          direction: 'in',
        },
      },
    }
  }

  const transaction = await buildTransaction(
    publicClient,
    {
      chain: CHAIN_MAP[chainId],
      account: userAddress,
      address: CONTRACT_ADDRESSES[chainId]!.Rebalancer,
      abi: REBALANCER_ABI,
      functionName: 'burn',
      args: [pool.key, burnAmount, minWithdrawAmountA, minWithdrawAmountB],
    },
    options?.gasLimit,
  )

  return {
    transaction,
    result: {
      currencyA: {
        currency: pool.currencyA,
        amount: formatUnits(withdrawAmountA, pool.currencyA.decimals),
        direction: 'out',
      },
      currencyB: {
        currency: pool.currencyB,
        amount: formatUnits(withdrawAmountB, pool.currencyB.decimals),
        direction: 'out',
      },
      lpCurrency: {
        currency: pool.currencyLp,
        amount: amount,
        direction: 'in',
      },
    },
  }
}

export const refillOrder = async ({
  chainId,
  userAddress,
  token0,
  token1,
  salt,
  options,
}: {
  chainId: CHAIN_IDS
  userAddress: `0x${string}`
  token0: `0x${string}`
  token1: `0x${string}`
  salt: `0x${string}`
  options?: DefaultWriteContractOptions & {
    useSubgraph?: boolean
    pool?: Pool
  }
}): Promise<Transaction> => {
  const publicClient = createPublicClient({
    chain: CHAIN_MAP[chainId],
    transport: options?.rpcUrl ? http(options.rpcUrl) : http(),
  })
  const pool = options?.pool
    ? options.pool
    : (
        await fetchPool(
          publicClient,
          chainId,
          [token0, token1],
          salt,
          !!(options && options.useSubgraph),
        )
      ).toJson()
  if (!pool.isOpened) {
    throw new Error(`
       Open the pool before rebalancing pool.
       import { openPool } from '@clober/v2-sdk'

       const transaction = await openPool({
            chainId: ${chainId},
            tokenA: '${token0}',
            tokenB: '${token1}',
            salt: '0x0000000000000000000000000000000000000000000000000000000000000000',
       })
    `)
  }

  return buildTransaction(
    publicClient,
    {
      chain: CHAIN_MAP[chainId],
      account: userAddress,
      address: CONTRACT_ADDRESSES[chainId]!.Rebalancer,
      abi: REBALANCER_ABI,
      functionName: 'rebalance',
      args: [pool.key],
    },
    options?.gasLimit,
    options?.gasPriceLimit,
  )
}

export const adjustOrderPrice = async ({
  chainId,
  userAddress,
  token0,
  token1,
  salt,
  oraclePrice,
  bidPrice,
  askPrice,
  alpha,
  options,
}: {
  chainId: CHAIN_IDS
  userAddress: `0x${string}`
  token0: `0x${string}`
  token1: `0x${string}`
  salt: `0x${string}`
  oraclePrice: string // price with currencyA as quote
  bidPrice: string // price with bookA. bid price
  askPrice: string // price with bookA. ask price
  alpha: string // alpha value, 0 < alpha <= 1
  options?: {
    bidTick?: bigint
    askTick?: bigint
    roundingUpBidPrice?: boolean
    roundingUpAskPrice?: boolean
    useSubgraph?: boolean
    pool?: Pool
  } & DefaultWriteContractOptions
}): Promise<Transaction> => {
  if (Number(alpha) <= 0 || Number(alpha) > 1) {
    throw new Error('Alpha value must be in the range (0, 1]')
  }
  if (Number(bidPrice) <= 0 || Number(askPrice) <= 0) {
    throw new Error('Price must be greater than 0')
  }
  if (Number(bidPrice) >= Number(askPrice)) {
    throw new Error('Bid price must be less than ask price')
  }
  const publicClient = createPublicClient({
    chain: CHAIN_MAP[chainId],
    transport: options?.rpcUrl ? http(options.rpcUrl) : http(),
  })
  const pool = options?.pool
    ? options.pool
    : (
        await fetchPool(
          publicClient,
          chainId,
          [token0, token1],
          salt,
          !!(options && options.useSubgraph),
        )
      ).toJson()
  if (!pool.isOpened) {
    throw new Error(`
       Open the pool before updating strategy price.
       import { openPool } from '@clober/v2-sdk'

       const transaction = await openPool({
            chainId: ${chainId},
            tokenA: '${token0}',
            tokenB: '${token1}',
            salt: '0x0000000000000000000000000000000000000000000000000000000000000000',
       })
    `)
  }
  const [roundingUpBidPrice, roundingUpAskPrice] = [
    options?.roundingUpBidPrice ? options.roundingUpBidPrice : false,
    options?.roundingUpAskPrice ? options.roundingUpAskPrice : false,
  ]
  const {
    roundingDownTick: roundingDownTickA,
    roundingUpTick: roundingUpTickA,
  } = parsePrice(
    Number(bidPrice),
    pool.currencyA.decimals,
    pool.currencyB.decimals,
  )
  const {
    roundingDownTick: roundingDownTickB,
    roundingUpTick: roundingUpTickB,
  } = parsePrice(
    Number(askPrice),
    pool.currencyA.decimals,
    pool.currencyB.decimals,
  )

  const oracleRawPrice = convertHumanReadablePriceToRawPrice(
    Number(oraclePrice),
    pool.currencyA.decimals,
    pool.currencyB.decimals,
  )
  const tickA = options?.bidTick
    ? Number(options.bidTick)
    : Number(roundingUpBidPrice ? roundingUpTickA : roundingDownTickA)
  let tickB = options?.askTick
    ? Number(options.askTick)
    : Number(
        invertTick(roundingUpAskPrice ? roundingUpTickB : roundingDownTickB),
      )

  if (invertTick(BigInt(tickB)) <= BigInt(tickA)) {
    tickB = Number(invertTick(BigInt(tickA + 1)))
  }

  const rateRaw = parseUnits(alpha, 6)

  return buildTransaction(
    publicClient,
    {
      chain: CHAIN_MAP[chainId],
      account: userAddress,
      address: CONTRACT_ADDRESSES[chainId]!.Operator,
      abi: OPERATOR_ABI,
      functionName: 'updatePosition',
      args: [pool.key, oracleRawPrice, tickA, tickB, rateRaw],
    },
    options?.gasLimit,
    options?.gasPriceLimit,
  )
}

export const setStrategyConfig = async ({
  chainId,
  userAddress,
  token0,
  token1,
  salt,
  config,
  options,
}: {
  chainId: CHAIN_IDS
  userAddress: `0x${string}`
  token0: `0x${string}`
  token1: `0x${string}`
  salt: `0x${string}`
  config: {
    referenceThreshold: string // 0 <= referenceThreshold <= 1
    rebalanceThreshold: string // 0 <= rebalanceThreshold <= 1
    rateA: string // 0 <= rateA <= 1
    rateB: string // 0 <= rateB <= 1
    minRateA: string // 0 <= minRateA <= rateA
    minRateB: string // 0 <= minRateB <= rateB
    priceThresholdA: string // 0 <= priceThresholdA <= 1
    priceThresholdB: string // 0 <= priceThresholdB <= 1
  }
  options?: {
    useSubgraph?: boolean
  } & DefaultWriteContractOptions
}): Promise<Transaction> => {
  // validate config
  if (
    Number(config.referenceThreshold) < 0 ||
    Number(config.referenceThreshold) > 1
  ) {
    throw new Error('Reference threshold must be in the range [0, 1]')
  }
  if (
    Number(config.rebalanceThreshold) < 0 ||
    Number(config.rebalanceThreshold) > 1
  ) {
    throw new Error('Rebalance threshold must be in the range [0, 1]')
  }
  if (
    Number(config.priceThresholdA) < 0 ||
    Number(config.priceThresholdA) > 1 ||
    Number(config.priceThresholdB) < 0 ||
    Number(config.priceThresholdB) > 1
  ) {
    throw new Error('Price threshold must be in the range [0, 1]')
  }
  if (
    Number(config.rateA) < 0 ||
    Number(config.rateA) > 1 ||
    Number(config.rateB) < 0 ||
    Number(config.rateB) > 1
  ) {
    throw new Error('Rate must be in the range [0, 1]')
  }
  if (
    Number(config.minRateA) < 0 ||
    Number(config.minRateA) > 1 ||
    Number(config.minRateB) < 0 ||
    Number(config.minRateB) > 1
  ) {
    throw new Error('Min rate must be in the range [0, 1]')
  }
  if (
    Number(config.minRateA) > Number(config.rateA) ||
    Number(config.minRateB) > Number(config.rateB)
  ) {
    throw new Error('Min rate must be less or equal to rate')
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
  )
  if (!pool.isOpened) {
    throw new Error(`
       Open the pool before set strategy config.
       import { openPool } from '@clober/v2-sdk'

       const transaction = await openPool({
            chainId: ${chainId},
            tokenA: '${token0}',
            tokenB: '${token1}',
       })
    `)
  }

  const configRaw = {
    referenceThreshold: parseUnits(config.referenceThreshold, 6),
    rebalanceThreshold: parseUnits(config.rebalanceThreshold, 6),
    rateA: parseUnits(config.rateA, 6),
    rateB: parseUnits(config.rateB, 6),
    minRateA: parseUnits(config.minRateA, 6),
    minRateB: parseUnits(config.minRateB, 6),
    priceThresholdA: parseUnits(config.priceThresholdA, 6),
    priceThresholdB: parseUnits(config.priceThresholdB, 6),
  }
  return buildTransaction(
    publicClient,
    {
      chain: CHAIN_MAP[chainId],
      account: userAddress,
      address: CONTRACT_ADDRESSES[chainId]!.Strategy,
      abi: STRATEGY_ABI,
      functionName: 'setConfig',
      args: [pool.key, configRaw],
    },
    options?.gasLimit,
  )
}

export const pausePool = async ({
  chainId,
  userAddress,
  token0,
  token1,
  salt,
  options,
}: {
  chainId: CHAIN_IDS
  userAddress: `0x${string}`
  token0: `0x${string}`
  token1: `0x${string}`
  salt: `0x${string}`
  options?: {
    useSubgraph?: boolean
    pool?: Pool
  } & DefaultWriteContractOptions
}): Promise<Transaction | undefined> => {
  const publicClient = createPublicClient({
    chain: CHAIN_MAP[chainId],
    transport: options?.rpcUrl ? http(options.rpcUrl) : http(),
  })
  const pool = options?.pool
    ? options.pool
    : (
        await fetchPool(
          publicClient,
          chainId,
          [token0, token1],
          salt,
          !!(options && options.useSubgraph),
        )
      ).toJson()
  if (!pool.isOpened) {
    throw new Error(`
       Open the pool before trying pause.
       import { openPool } from '@clober/v2-sdk'

       const transaction = await openPool({
            chainId: ${chainId},
            tokenA: '${token0}',
            tokenB: '${token1}',
            salt: '0x0000000000000000000000000000000000000000000000000000000000000000',
       })
    `)
  }

  if (pool.paused) {
    return undefined
  }

  return buildTransaction(
    publicClient,
    {
      chain: CHAIN_MAP[chainId],
      account: userAddress,
      address: CONTRACT_ADDRESSES[chainId]!.Operator,
      abi: OPERATOR_ABI,
      functionName: 'pause',
      args: [pool.key],
    },
    options?.gasLimit,
    options?.gasPriceLimit,
  )
}

export const resumePool = async ({
  chainId,
  userAddress,
  token0,
  token1,
  salt,
  options,
}: {
  chainId: CHAIN_IDS
  userAddress: `0x${string}`
  token0: `0x${string}`
  token1: `0x${string}`
  salt: `0x${string}`
  options?: {
    useSubgraph?: boolean
    pool?: Pool
  } & DefaultWriteContractOptions
}): Promise<Transaction | undefined> => {
  const publicClient = createPublicClient({
    chain: CHAIN_MAP[chainId],
    transport: options?.rpcUrl ? http(options.rpcUrl) : http(),
  })
  const pool = options?.pool
    ? options.pool
    : (
        await fetchPool(
          publicClient,
          chainId,
          [token0, token1],
          salt,
          !!(options && options.useSubgraph),
        )
      ).toJson()
  if (!pool.isOpened) {
    throw new Error(`
       Open the pool before trying resume.
       import { openPool } from '@clober/v2-sdk'

       const transaction = await openPool({
            chainId: ${chainId},
            tokenA: '${token0}',
            tokenB: '${token1}',
            salt: '0x0000000000000000000000000000000000000000000000000000000000000000',
       })
    `)
  }

  if (!pool.paused) {
    return undefined
  }

  return buildTransaction(
    publicClient,
    {
      chain: CHAIN_MAP[chainId],
      account: userAddress,
      address: CONTRACT_ADDRESSES[chainId]!.Strategy,
      abi: STRATEGY_ABI,
      functionName: 'unpause',
      args: [pool.key],
    },
    options?.gasLimit,
    options?.gasPriceLimit,
  )
}
