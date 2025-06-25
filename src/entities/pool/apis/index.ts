import { getAddress, PublicClient } from 'viem'

import { CHAIN_IDS } from '../../../constants/chain-configs/chain'
import { CONTRACT_ADDRESSES } from '../../../constants/chain-configs/addresses'
import { REBALANCER_ABI } from '../../../constants/abis/rebalancer/rebalancer-abi'
import { Market } from '../../../types'
import { STRATEGY_ABI } from '../../../constants/abis/rebalancer/strategy-abi'
import { fetchMarket } from '../../market/apis'
import { PoolModel } from '../model'
import { toPoolKey } from '../utils/pool-key'
import { WRAPPED_6909_FACTORY_ABI } from '../../../constants/abis/rebalancer/wrapped-6909-factory-abi'

export async function fetchPool(
  publicClient: PublicClient,
  chainId: CHAIN_IDS,
  tokenAddresses: `0x${string}`[],
  salt: `0x${string}`,
  useSubgraph: boolean,
  market?: Market,
): Promise<PoolModel> {
  if (tokenAddresses.length !== 2) {
    throw new Error('Invalid token pair')
  }
  if (!market) {
    market = (
      await fetchMarket(publicClient, chainId, tokenAddresses, useSubgraph)
    ).toJson()
  }
  const poolKey = toPoolKey(
    BigInt(market.bidBook.id),
    BigInt(market.askBook.id),
    salt,
  )
  const [
    { bookIdA, bookIdB, reserveA, reserveB, orderListA, orderListB },
    totalSupply,
    [totalLiquidityA, totalLiquidityB],
    paused,
    wrapped6909Address,
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
      {
        address: CONTRACT_ADDRESSES[chainId]!.Strategy,
        abi: STRATEGY_ABI,
        functionName: 'isPaused',
        args: [poolKey],
      },
      {
        address: CONTRACT_ADDRESSES[chainId]!.Wrapped6909Factory,
        abi: WRAPPED_6909_FACTORY_ABI,
        functionName: 'getWrapped6909Address',
        args: [CONTRACT_ADDRESSES[chainId]!.Rebalancer, BigInt(poolKey)],
      },
    ],
  })
  const liquidityA =
    totalLiquidityA.reserve +
    totalLiquidityA.cancelable +
    totalLiquidityA.claimable
  const liquidityB =
    totalLiquidityB.reserve +
    totalLiquidityB.cancelable +
    totalLiquidityB.claimable
  return new PoolModel({
    chainId,
    market,
    isOpened: bookIdA > 0 && bookIdB > 0,
    bookIdA,
    bookIdB,
    poolKey,
    wrappedTokenAddress: getAddress(wrapped6909Address),
    salt,
    totalSupply: BigInt(totalSupply),
    decimals: 18,
    liquidityA: BigInt(liquidityA),
    liquidityB: BigInt(liquidityB),
    cancelableA: BigInt(totalLiquidityA.cancelable),
    cancelableB: BigInt(totalLiquidityB.cancelable),
    claimableA: BigInt(totalLiquidityA.claimable),
    claimableB: BigInt(totalLiquidityB.claimable),
    reserveA: BigInt(reserveA),
    reserveB: BigInt(reserveB),
    orderListA: orderListA.map((id: bigint) => BigInt(id)),
    orderListB: orderListB.map((id: bigint) => BigInt(id)),
    paused,
  })
}
