import { PublicClient } from 'viem'

import { CHAIN_IDS } from '../constants/chain'
import { CONTRACT_ADDRESSES } from '../constants/addresses'
import { Market, StrategyPrice } from '../type'
import { STRATEGY_ABI } from '../abis/rebalancer/strategy-abi'
import { toPoolKey } from '../utils/pool-key'

import { fetchPool } from './pool'

export async function fetchStrategyPrice(
  publicClient: PublicClient,
  chainId: CHAIN_IDS,
  tokenAddresses: `0x${string}`[],
  salt: `0x${string}`,
  useSubgraph: boolean,
  market?: Market,
): Promise<StrategyPrice> {
  let poolKey: `0x${string}` | undefined = undefined
  if (market) {
    poolKey = toPoolKey(
      BigInt(market.bidBook.id),
      BigInt(market.askBook.id),
      salt,
    )
  } else {
    const pool = await fetchPool(
      publicClient,
      chainId,
      tokenAddresses,
      salt,
      useSubgraph,
    )
    poolKey = pool.key
  }
  const getPriceResult = await publicClient.readContract({
    address: CONTRACT_ADDRESSES[chainId]!.Strategy,
    abi: STRATEGY_ABI,
    functionName: 'getPrice',
    args: [poolKey],
  })
  return {
    oraclePrice: BigInt(getPriceResult.oraclePrice),
    bidTick: BigInt(getPriceResult.tickA),
    askTick: BigInt(getPriceResult.tickB),
  }
}
