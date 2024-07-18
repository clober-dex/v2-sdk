import {
  createPublicClient,
  formatUnits,
  http,
  isAddressEqual,
  parseUnits,
  zeroAddress,
  zeroHash,
} from 'viem'

import { CHAIN_IDS, CHAIN_MAP } from './constants/chain'
import type {
  CurrencyFlow,
  DefaultOptions,
  ERC20PermitParam,
  Transaction,
} from './type'
import { calculateUnitSize } from './utils/unit-size'
import { CONTROLLER_ABI } from './abis/core/controller-abi'
import { getDeadlineTimestampInSeconds } from './utils/time'
import { buildTransaction } from './utils/build-transaction'
import { CONTRACT_ADDRESSES } from './constants/addresses'
import { MAKER_DEFAULT_POLICY, TAKER_DEFAULT_POLICY } from './constants/fee'
import { fetchMarket } from './apis/market'
import { formatPrice, parsePrice } from './utils/prices'
import { invertTick, toPrice } from './utils/tick'
import { getExpectedInput, getExpectedOutput } from './view'
import { toBookId } from './utils/book-id'
import { fetchIsApprovedForAll } from './utils/approval'
import { fetchOrders } from './utils/order'
import { applyPercent } from './utils/bigint'
import { fetchPool } from './apis/pool'
import { REBALANCER_ABI } from './abis/rebalancer/rebalancer-abi'

/**
 * Build a transaction to open a market.
 *
 * @param chainId The chain ID of the blockchain.
 * @param userAddress The address of the user.
 * @param inputToken The address of the input token.
 * @param outputToken The address of the output token.
 * @param options
 * @param options.rpcUrl The RPC URL of the blockchain.
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
  options?: DefaultOptions
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
    const unitSize = await calculateUnitSize(
      publicClient,
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
 * @param {Object} [options] Optional parameters for the limit order.
 * @param {erc20PermitParam} [options.erc20PermitParam] The permit signature for token approval.
 * @param {boolean} [options.postOnly] A boolean indicating whether the order is only to be made not taken.
 * @param {string} [options.rpcUrl] The RPC URL of the blockchain.
 * @param {number} [options.gasLimit] The gas limit to use for the transaction.
 * @param {bigint} [options.makeTick] The tick for the make order.
 * @param {bigint} [options.takeLimitTick] The tick for the take order.
 * @param {boolean} [options.useSubgraph] A boolean indicating whether to use the subgraph for fetching orders.
 * @returns {Promise<{ transaction: Transaction, result: { make: CurrencyFlow, take: CurrencyFlow, spent: CurrencyFlow }>}
 * Promise resolving to the transaction object representing the limit order with the result of the order.
 * @example
 * import { signERC20Permit, limitOrder } from '@clober/v2-sdk'
 * import { privateKeyToAccount } from 'viem/accounts'
 *
 * const erc20PermitParam = await signERC20Permit({
 *   chainId: 421614,
 *   walletClient,
 *   token: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
 *   amount: '100.123'
 * })
 *
 * const { transaction } = await limitOrder({
 *   chainId: 421614,
 *   userAddress: '0xF8c1869Ecd4df136693C45EcE1b67f85B6bDaE69
 *   inputToken: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
 *   outputToken: '0x0000000000000000000000000000000000000000',
 *   amount: '100.123', // 100.123 USDC
 *   price: '4000.01', // price at 4000.01 (ETH/USDC)
 *   options: { erc20PermitParam }
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
  } & DefaultOptions
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
  const [unitSize, { takenAmount, spentAmount, bookId, events }] =
    await Promise.all([
      calculateUnitSize(publicClient, chainId, inputCurrency),
      getExpectedOutput({
        chainId,
        inputToken,
        outputToken,
        amountIn: amount,
        options: {
          ...options,
          limitPrice: price,
        },
      }),
    ])
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
 * @param {Object} [options] Optional parameters for the market order.
 * @param {erc20PermitParam} [options.erc20PermitParam] The permit signature for token approval.
 * @param {string} [options.rpcUrl] The RPC URL of the blockchain.
 * @param {number} [options.gasLimit] The gas limit to use for the transaction.
 * @param {boolean} [options.useSubgraph] A boolean indicating whether to use the subgraph for fetching orders.
 * @param {number} [options.slippage] The maximum slippage percentage allowed for the order.
 * if the slippage is not provided, unlimited slippage is allowed.
 * @returns {Promise<{ transaction: Transaction, result: { spent: CurrencyFlow, taken: CurrencyFlow } }>}
 * Promise resolving to the transaction object representing the market order with the result of the order.
 * @example
 * import { signERC20Permit, marketOrder } from '@clober/v2-sdk'
 * import { privateKeyToAccount } from 'viem/accounts'
 *
 * const erc20PermitParam = await signERC20Permit({
 *   chainId: 421614,
 *   walletClient,
 *   token: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
 *   amount: '100.123'
 * })
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
  } & DefaultOptions
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
 * @param {Object} [options] Optional parameters for claiming orders.
 * @param {string} [options.rpcUrl] The RPC URL to use for executing the transaction.
 * @param {number} [options.gasLimit] The gas limit to use for the transaction.
 * @param {boolean} [options.useSubgraph] A boolean indicating whether to use the subgraph for fetching orders.
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
  options?: DefaultOptions
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
 * @param {Object} [options] Optional parameters for claiming orders.
 * @param {string} [options.rpcUrl] The RPC URL to use for executing the transaction.
 * @param {number} [options.gasLimit] The gas limit to use for the transaction.
 * @param {boolean} [options.useSubgraph] A boolean indicating whether to use the subgraph for fetching orders.
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
  options?: DefaultOptions
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

  const orders = (
    await fetchOrders(
      publicClient,
      chainId,
      ids.map((id) => BigInt(id)),
      !!(options && options.useSubgraph),
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
 * @param {Object} [options] Optional parameters for canceling orders.
 * @param {string} [options.rpcUrl] The RPC URL to use for executing the transaction.
 * @param {number} [options.gasLimit] The gas limit to use for the transaction.
 * @param {boolean} [options.useSubgraph] A boolean indicating whether to use the subgraph for fetching orders.
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
  options?: DefaultOptions
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
 * @param {Object} [options] Optional parameters for canceling orders.
 * @param {string} [options.rpcUrl] The RPC URL to use for executing the transaction.
 * @param {number} [options.gasLimit] The gas limit to use for the transaction.
 * @param {boolean} [options.useSubgraph] A boolean indicating whether to use the subgraph for fetching orders.
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
  options?: DefaultOptions
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

  const orders = (
    await fetchOrders(
      publicClient,
      chainId,
      ids.map((id) => BigInt(id)),
      !!(options && options.useSubgraph),
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

export const openPool = async ({
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
  options?: DefaultOptions
}): Promise<Transaction | undefined> => {
  const publicClient = createPublicClient({
    chain: CHAIN_MAP[chainId],
    transport: options?.rpcUrl ? http(options.rpcUrl) : http(),
  })
  const pool = await fetchPool(
    publicClient,
    chainId,
    [inputToken, outputToken],
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
          CONTRACT_ADDRESSES[chainId]!.Strategy,
        ],
      },
      options?.gasLimit,
    )
  }
  return undefined
}
