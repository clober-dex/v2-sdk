import {
  formatUnits,
  isAddressEqual,
  parseUnits,
  zeroAddress,
  zeroHash,
} from 'viem'

import { CHAIN_IDS, CHAIN_MAP } from './constants/chain'
import type {
  CurrencyFlow,
  DefaultOptions,
  PermitSignature,
  Transaction,
} from './type'
import { calculateUnit } from './utils/unit'
import { CONTROLLER_ABI } from './abis/core/controller-abi'
import { getDeadlineTimestampInSeconds } from './utils/time'
import { buildTransaction } from './utils/build-transaction'
import { CONTRACT_ADDRESSES } from './constants/addresses'
import { MAKER_DEFAULT_POLICY, TAKER_DEFAULT_POLICY } from './constants/fee'
import { fetchMarket } from './apis/market'
import { parsePrice } from './utils/prices'
import { fromPrice, invertPrice } from './utils/tick'
import { getExpectedOutput } from './view'
import { toBookId } from './utils/book-id'
import { fetchIsApprovedForAll } from './utils/approval'
import { decorator } from './utils/decorator'
import { fetchOrders } from './utils/order'
import { quoteToBase } from './utils/decimals'
import { applyPercent } from './utils/bigint'

/**
 * Build a transaction to open a market.
 *
 * @param chainId The chain ID of the blockchain.
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
 *   inputToken: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
 *   outputToken: '0x0000000000000000000000000000000000000000'
 * })
 */
export const openMarket = decorator(
  async ({
    chainId,
    inputToken,
    outputToken,
  }: {
    chainId: CHAIN_IDS
    inputToken: `0x${string}`
    outputToken: `0x${string}`
    options?: DefaultOptions
  }): Promise<Transaction | undefined> => {
    const market = await fetchMarket(chainId, [inputToken, outputToken])
    const isBid = isAddressEqual(market.quote.address, inputToken)
    if ((isBid && !market.bidBookOpen) || (!isBid && !market.askBookOpen)) {
      const unit = await calculateUnit(
        chainId,
        isBid ? market.quote : market.base,
      )
      return buildTransaction(chainId, {
        address: CONTRACT_ADDRESSES[chainId]!.Controller,
        abi: CONTROLLER_ABI,
        functionName: 'open',
        args: [
          [
            {
              key: {
                base: inputToken,
                unit,
                quote: outputToken,
                makerPolicy: MAKER_DEFAULT_POLICY.value,
                hooks: zeroAddress,
                takerPolicy: TAKER_DEFAULT_POLICY.value,
              },
              hookData: zeroHash,
            },
          ],
          getDeadlineTimestampInSeconds(),
        ],
      })
    }
    return undefined
  },
)

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
 * @param {PermitSignature} [options.signature] The permit signature for token approval.
 * @param {boolean} [options.postOnly] A boolean indicating whether the order is only to be made not taken.
 * @param {string} [options.rpcUrl] The RPC URL of the blockchain.
 * @returns {Promise<{ transaction: Transaction, result: { make: CurrencyFlow, take: CurrencyFlow } }>}
 * Promise resolving to the transaction object representing the limit order with the result of the order.
 * @example
 * import { signERC20Permit, limitOrder } from '@clober/v2-sdk'
 * import { privateKeyToAccount } from 'viem/accounts'
 *
 * const signature = await signERC20Permit({
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
 *   options: { signature }
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
export const limitOrder = decorator(
  async ({
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
      signature?: PermitSignature
      postOnly?: boolean
    } & DefaultOptions
  }): Promise<{
    transaction: Transaction
    result: {
      make: CurrencyFlow
      take: CurrencyFlow
    }
  }> => {
    const market = await fetchMarket(chainId, [inputToken, outputToken])
    const isBid = isAddressEqual(market.quote.address, inputToken)
    if ((isBid && !market.bidBookOpen) || (!isBid && !market.askBookOpen)) {
      throw new Error(`
       Open the market before placing a limit order.
       import { openMarket } from '@clober/v2-sdk'

       const transaction = await openMarket(
            ${chainId},
           '${inputToken}',
           '${outputToken}',
       )
    `)
    }

    const rawPrice = parsePrice(
      Number(price),
      market.quote.decimals,
      market.base.decimals,
    )
    const tick = isBid ? fromPrice(rawPrice) : fromPrice(invertPrice(rawPrice))
    const tokensToSettle = [inputToken, outputToken].filter(
      (address) => !isAddressEqual(address, zeroAddress),
    )
    const quoteAmount = parseUnits(
      amount,
      isBid ? market.quote.decimals : market.base.decimals,
    )
    const [unit, { spendAmount, bookId }] = await Promise.all([
      calculateUnit(chainId, isBid ? market.quote : market.base),
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
    const permitParamsList =
      options?.signature && !isETH
        ? [
            {
              token: inputToken,
              permitAmount: quoteAmount,
              signature: options.signature,
            },
          ]
        : []

    const makeParam = {
      id: toBookId(inputToken, outputToken, unit),
      tick: Number(tick),
      quoteAmount,
      hookData: zeroHash,
    }
    if (options?.postOnly === true || spendAmount === '0') {
      return {
        transaction: await buildTransaction(chainId, {
          chain: CHAIN_MAP[chainId],
          account: userAddress,
          address: CONTRACT_ADDRESSES[chainId]!.Controller,
          abi: CONTROLLER_ABI,
          functionName: 'make',
          args: [
            [makeParam],
            tokensToSettle,
            permitParamsList,
            getDeadlineTimestampInSeconds(),
          ],
          value: isETH ? quoteAmount : 0n,
        }),
        result: {
          make: {
            amount: formatUnits(
              quoteAmount,
              isBid ? market.quote.decimals : market.base.decimals,
            ),
            currency: isBid ? market.quote : market.base,
            direction: 'in',
          },
          take: {
            amount: '0',
            currency: isBid ? market.base : market.quote,
            direction: 'out',
          },
        },
      }
    } else {
      // take and make
      return {
        transaction: await buildTransaction(chainId, {
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
                limitPrice: isBid ? invertPrice(rawPrice) : rawPrice,
                tick: makeParam.tick,
                quoteAmount,
                takeHookData: zeroHash,
                makeHookData: makeParam.hookData,
              },
            ],
            tokensToSettle,
            permitParamsList,
            getDeadlineTimestampInSeconds(),
          ],
          value: isETH ? quoteAmount : 0n,
        }),
        result: {
          make: {
            amount: formatUnits(
              quoteAmount,
              isBid ? market.quote.decimals : market.base.decimals,
            ),
            currency: isBid ? market.quote : market.base,
            direction: 'in',
          },
          take: {
            amount: spendAmount,
            currency: isBid ? market.base : market.quote,
            direction: 'out',
          },
        },
      }
    }
  },
)

/**
 * Executes a market order on the specified chain for trading tokens.
 *
 * @param {CHAIN_IDS} chainId The chain ID.
 * @param {`0x${string}`} userAddress The Ethereum address of the user placing the order.
 * @param {`0x${string}`} inputToken The address of the token to be used as input.
 * @param {`0x${string}`} outputToken The address of the token to be received as output.
 * @param {string} amount The amount of input tokens for the order.
 * @param {Object} [options] Optional parameters for the limit order.
 * @param {PermitSignature} [options.signature] The permit signature for token approval.
 * @param {string} [options.rpcUrl] The RPC URL of the blockchain.
 * @param {string} [options.limitPrice] The upper bound price to tolerate for the market bid, or the lower bound price to tolerate for the market ask.
 * if the limit price is not provided, unlimited slippage is allowed.
 * @returns {Promise<Transaction>} Promise resolving to the transaction object representing the limit order.
 * @example
 * import { signERC20Permit, marketOrder } from '@clober/v2-sdk'
 * import { privateKeyToAccount } from 'viem/accounts'
 *
 * const signature = await signERC20Permit({
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
 *   options: { signature }
 * })
 *
 */
export const marketOrder = decorator(
  async ({
    chainId,
    userAddress,
    inputToken,
    outputToken,
    amount,
    options,
  }: {
    chainId: CHAIN_IDS
    userAddress: `0x${string}`
    inputToken: `0x${string}`
    outputToken: `0x${string}`
    amount: string
    options?: {
      signature?: PermitSignature
      limitPrice?: string
    } & DefaultOptions
  }): Promise<Transaction> => {
    const market = await fetchMarket(chainId, [inputToken, outputToken])
    const isBid = isAddressEqual(market.quote.address, inputToken)
    if ((isBid && !market.bidBookOpen) || (!isBid && !market.askBookOpen)) {
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

    const rawLimitPrice = parsePrice(
      Number(options?.limitPrice ?? '0'),
      market.quote.decimals,
      market.base.decimals,
    )
    const tokensToSettle = [inputToken, outputToken].filter(
      (address) => !isAddressEqual(address, zeroAddress),
    )
    const quoteAmount = parseUnits(
      amount,
      isBid ? market.quote.decimals : market.base.decimals,
    )
    const { bookId, takenAmount } = await getExpectedOutput({
      chainId,
      inputToken,
      outputToken,
      amountIn: amount,
      options: {
        ...options,
        // todo: pass limit price
      },
    })
    const isETH = isAddressEqual(inputToken, zeroAddress)
    const permitParamsList =
      options?.signature && !isETH
        ? [
            {
              token: inputToken,
              permitAmount: quoteAmount,
              signature: options.signature,
            },
          ]
        : []

    return buildTransaction(chainId, {
      chain: CHAIN_MAP[chainId],
      account: userAddress,
      address: CONTRACT_ADDRESSES[chainId]!.Controller,
      abi: CONTROLLER_ABI,
      functionName: 'take',
      args: [
        [
          {
            id: bookId,
            limitPrice: isBid ? invertPrice(rawLimitPrice) : rawLimitPrice,
            quoteAmount: takenAmount,
            hookData: zeroHash,
          },
        ],
        tokensToSettle,
        permitParamsList,
        getDeadlineTimestampInSeconds(),
      ],
      value: isETH ? quoteAmount : 0n,
    })
  },
)

/**
 * Claims specified open order for settlement.
 * [IMPORTANT] Set ApprovalForAll before calling this function.
 *
 * @param {CHAIN_IDS} chainId The chain ID.
 * @param {`0x${string}`} userAddress The Ethereum address of the user.
 * @param {string} id An ID representing the open order to be claimed.
 * @param {Object} [options] Optional parameters for claiming orders.
 * @param {string} [options.rpcUrl] The RPC URL to use for executing the transaction.
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
export const claimOrder = decorator(
  async ({
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
  },
)

/**
 * Claims specified open orders for settlement.
 * [IMPORTANT] Set ApprovalForAll before calling this function.
 *
 * @param {CHAIN_IDS} chainId The chain ID.
 * @param {`0x${string}`} userAddress The Ethereum address of the user.
 * @param {string[]} ids An array of IDs representing the open orders to be claimed.
 * @param {Object} [options] Optional parameters for claiming orders.
 * @param {string} [options.rpcUrl] The RPC URL to use for executing the transaction.
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
export const claimOrders = decorator(
  async ({
    chainId,
    userAddress,
    ids,
  }: {
    chainId: CHAIN_IDS
    userAddress: `0x${string}`
    ids: string[]
    options?: DefaultOptions
  }): Promise<{ transaction: Transaction; result: CurrencyFlow[] }> => {
    const isApprovedForAll = await fetchIsApprovedForAll(chainId, userAddress)
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
        chainId,
        ids.map((id) => BigInt(id)),
      )
    ).filter(
      (order) =>
        isAddressEqual(order.owner, userAddress) && order.claimable > 0n,
    )
    const tokensToSettle = orders
      .map((order) => [order.baseCurrency.address, order.quoteCurrency.address])
      .flat()
      .filter(
        (address, index, self) =>
          self.findIndex((c) => isAddressEqual(c, address)) === index,
      )
      .filter((address) => !isAddressEqual(address, zeroAddress))

    return {
      transaction: await buildTransaction(chainId, {
        chain: CHAIN_MAP[chainId],
        account: userAddress,
        address: CONTRACT_ADDRESSES[chainId]!.Controller,
        abi: CONTROLLER_ABI,
        functionName: 'claim',
        args: [
          orders.map(({ orderId }) => ({
            id: orderId,
            hookData: zeroHash,
          })),
          tokensToSettle,
          [],
          getDeadlineTimestampInSeconds(),
        ],
      }),
      result: orders
        .map((order) => {
          const amount = quoteToBase(
            order.tick,
            order.unit * order.claimable,
            false,
          )
          return {
            currency: order.baseCurrency,
            amount: formatUnits(amount, order.baseCurrency.decimals),
          }
        })
        .reduce((acc, { currency, amount }) => {
          const index = acc.findIndex((c) =>
            isAddressEqual(c.currency.address, currency.address),
          )
          if (index === -1) {
            return [...acc, { currency, amount, direction: 'out' }]
          }
          acc[index].amount = (
            Number(acc[index].amount) + Number(amount)
          ).toString()
          return acc
        }, [] as CurrencyFlow[]),
    }
  },
)

/**
 * Cancels specified open order if the order is not fully filled.
 * [IMPORTANT] Set ApprovalForAll before calling this function.
 *
 * @param {CHAIN_IDS} chainId The chain ID.
 * @param {`0x${string}`} userAddress The Ethereum address of the user.
 * @param {string} id An ID representing the open order to be canceled
 * @param {Object} [options] Optional parameters for canceling orders.
 * @param {string} [options.rpcUrl] The RPC URL to use for executing the transaction.
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
export const cancelOrder = decorator(
  async ({
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
  },
)

/**
 * Cancels specified open orders if orders are not fully filled.
 * [IMPORTANT] Set ApprovalForAll before calling this function.
 *
 * @param {CHAIN_IDS} chainId The chain ID.
 * @param {`0x${string}`} userAddress The Ethereum address of the user.
 * @param {string[]} ids An array of IDs representing the open orders to be canceled.
 * @param {Object} [options] Optional parameters for canceling orders.
 * @param {string} [options.rpcUrl] The RPC URL to use for executing the transaction.
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
export const cancelOrders = decorator(
  async ({
    chainId,
    userAddress,
    ids,
  }: {
    chainId: CHAIN_IDS
    userAddress: `0x${string}`
    ids: string[]
    options?: DefaultOptions
  }): Promise<{ transaction: Transaction; result: CurrencyFlow[] }> => {
    const isApprovedForAll = await fetchIsApprovedForAll(chainId, userAddress)
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
        chainId,
        ids.map((id) => BigInt(id)),
      )
    ).filter(
      (order) => isAddressEqual(order.owner, userAddress) && order.open > 0n,
    )
    const tokensToSettle = orders
      .map((order) => [order.baseCurrency.address, order.quoteCurrency.address])
      .flat()
      .filter(
        (address, index, self) =>
          self.findIndex((c) => isAddressEqual(c, address)) === index,
      )
      .filter((address) => !isAddressEqual(address, zeroAddress))

    return {
      transaction: await buildTransaction(chainId, {
        chain: CHAIN_MAP[chainId],
        account: userAddress,
        address: CONTRACT_ADDRESSES[chainId]!.Controller,
        abi: CONTROLLER_ABI,
        functionName: 'cancel',
        args: [
          orders.map(({ orderId }) => ({
            id: orderId,
            leftQuoteAmount: 0n,
            hookData: zeroHash,
          })),
          tokensToSettle,
          [],
          getDeadlineTimestampInSeconds(),
        ],
      }),
      result: orders
        .map((order) => {
          const amount = applyPercent(
            order.unit * order.open,
            100 +
              (Number(MAKER_DEFAULT_POLICY.rate) * 100) /
                Number(MAKER_DEFAULT_POLICY.RATE_PRECISION),
            6,
          )
          return {
            currency: order.quoteCurrency,
            amount: formatUnits(amount, order.quoteCurrency.decimals),
          }
        })
        .reduce((acc, { currency, amount }) => {
          const index = acc.findIndex((c) =>
            isAddressEqual(c.currency.address, currency.address),
          )
          if (index === -1) {
            return [...acc, { currency, amount, direction: 'out' }]
          }
          acc[index].amount = (
            Number(acc[index].amount) + Number(amount)
          ).toString()
          return acc
        }, [] as CurrencyFlow[]),
    }
  },
)
