import { PublicClient } from 'viem'

import { CHAIN_IDS } from '../constants/chain'
import { Pool } from '../model/pool'
import { CONTRACT_ADDRESSES } from '../constants/addresses'
import { toPoolKey } from '../utils/pool-key'
import { fetchOrders } from '../utils/order'

import { fetchMarket } from './market'

export async function fetchPool(
  publicClient: PublicClient,
  chainId: CHAIN_IDS,
  tokenAddresses: `0x${string}`[],
  useSubgraph: boolean,
): Promise<Pool> {
  if (tokenAddresses.length !== 2) {
    throw new Error('Invalid token pair')
  }
  const market = await fetchMarket(
    publicClient,
    chainId,
    tokenAddresses,
    useSubgraph,
  )
  const poolKey = toPoolKey(market.bidBook.id, market.askBook.id)
  const { bookIdA, bookIdB, reserveA, reserveB, orderListA, orderListB } =
    await publicClient.readContract({
      address: CONTRACT_ADDRESSES[chainId]!.Rebalancer,
      abi: [
        {
          inputs: [
            {
              internalType: 'bytes32',
              name: 'key',
              type: 'bytes32',
            },
          ],
          name: 'getPool',
          outputs: [
            {
              components: [
                {
                  internalType: 'BookId',
                  name: 'bookIdA',
                  type: 'uint192',
                },
                {
                  internalType: 'BookId',
                  name: 'bookIdB',
                  type: 'uint192',
                },
                {
                  internalType: 'contract IStrategy',
                  name: 'strategy',
                  type: 'address',
                },
                {
                  internalType: 'uint256',
                  name: 'reserveA',
                  type: 'uint256',
                },
                {
                  internalType: 'uint256',
                  name: 'reserveB',
                  type: 'uint256',
                },
                {
                  internalType: 'OrderId[]',
                  name: 'orderListA',
                  type: 'uint256[]',
                },
                {
                  internalType: 'OrderId[]',
                  name: 'orderListB',
                  type: 'uint256[]',
                },
              ],
              internalType: 'struct IRebalancer.Pool',
              name: '',
              type: 'tuple',
            },
          ],
          stateMutability: 'view',
          type: 'function',
        },
      ] as const,
      functionName: 'getPool',
      args: [poolKey],
    })
  const orders = await fetchOrders(
    publicClient,
    chainId,
    [...orderListA, ...orderListB],
    useSubgraph,
  )
  return new Pool({
    chainId,
    market,
    isOpened: bookIdA > 0 && bookIdB > 0,
    bookIdA,
    bookIdB,
    reserveA: BigInt(reserveA),
    reserveB: BigInt(reserveB),
    orderListA: orders.filter((order) => orderListA.includes(BigInt(order.id))),
    orderListB: orders.filter((order) => orderListB.includes(BigInt(order.id))),
  })
}
