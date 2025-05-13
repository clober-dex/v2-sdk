import { CHAIN_IDS } from '../constants/chain-configs/chain'
import { OpenOrder } from '../entities/open-order/types'
import {
  fetchOpenOrderByOrderIdFromSubgraph,
  fetchOpenOrdersByUserAddressFromSubgraph,
} from '../entities/open-order/apis'

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
