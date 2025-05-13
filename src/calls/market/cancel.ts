import {
  createPublicClient,
  http,
  isAddressEqual,
  zeroAddress,
  zeroHash,
} from 'viem'

import { CHAIN_IDS, CHAIN_MAP } from '../../constants/chain'
import {
  CurrencyFlow,
  DefaultWriteContractOptions,
  OpenOrder,
  Transaction,
} from '../../type'
import { fetchIsApprovedForAll } from '../../entities/currency/apis/approval'
import { OnChainOpenOrder } from '../../entities/open-order/model'
import {
  fetchOnChainOrders,
  fetchOpenOrdersByOrderIdsFromSubgraph,
} from '../../entities/open-order/api'
import { buildTransaction } from '../../utils/build-transaction'
import { CONTRACT_ADDRESSES } from '../../constants/addresses'
import { CONTROLLER_ABI } from '../../abis/core/controller-abi'
import { getDeadlineTimestampInSeconds } from '../../utils/time'

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
