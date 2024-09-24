import { PublicClient } from 'viem'

import { CHAIN_IDS } from '../constants/chain'
import { Pool } from '../model/pool'
import { CONTRACT_ADDRESSES } from '../constants/addresses'
import { toPoolKey } from '../utils/pool-key'
import { fetchOnChainOrders } from '../utils/order'
import { REBALANCER_ABI } from '../abis/rebalancer/rebalancer-abi'

import { fetchMarket } from './market'

export async function fetchPool(
  publicClient: PublicClient,
  chainId: CHAIN_IDS,
  tokenAddresses: `0x${string}`[],
  salt: `0x${string}`,
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
  const poolKey = toPoolKey(market.bidBook.id, market.askBook.id, salt)
  const [
    { bookIdA, bookIdB, reserveA, reserveB, orderListA, orderListB },
    totalSupply,
    [liquidityA, liquidityB],
  ] = await publicClient.multicall({
    allowFailure: false,
    contracts: [
      {
        address: CONTRACT_ADDRESSES[chainId]!.Rebalancer,
        abi: REBALANCER_ABI,
        functionName: 'getPool',
        args: [poolKey],
      },
      {
        address: CONTRACT_ADDRESSES[chainId]!.Rebalancer,
        abi: REBALANCER_ABI,
        functionName: 'totalSupply',
        args: [BigInt(poolKey)],
      },
      {
        address: CONTRACT_ADDRESSES[chainId]!.Rebalancer,
        abi: REBALANCER_ABI,
        functionName: 'getLiquidity',
        args: [poolKey],
      },
    ],
  })
  const orders = await fetchOnChainOrders(
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
    salt,
    poolKey,
    totalSupply: BigInt(totalSupply),
    decimals:
      market.base.decimals > market.quote.decimals
        ? market.base.decimals
        : market.quote.decimals,
    liquidityA: BigInt(liquidityA),
    liquidityB: BigInt(liquidityB),
    reserveA: BigInt(reserveA),
    reserveB: BigInt(reserveB),
    orderListA: orders.filter((order) => orderListA.includes(BigInt(order.id))),
    orderListB: orders.filter((order) => orderListB.includes(BigInt(order.id))),
  })
}
