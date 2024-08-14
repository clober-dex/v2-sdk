import { PublicClient } from 'viem'

import { CHAIN_IDS } from '../constants/chain'
import { CONTRACT_ADDRESSES } from '../constants/addresses'
import { StrategyPrice } from '../model/strategy'
import { STRATEGY_ABI } from '../abis/rebalancer/strategy-abi'
import { formatPrice } from '../utils/prices'

import { fetchPool } from './pool'

export async function fetchStrategyPrice(
  publicClient: PublicClient,
  chainId: CHAIN_IDS,
  tokenAddresses: `0x${string}`[],
  salt: `0x${string}`,
  useSubgraph: boolean,
): Promise<StrategyPrice> {
  const pool = await fetchPool(
    publicClient,
    chainId,
    tokenAddresses,
    salt,
    useSubgraph,
  )
  const getPriceResult = await publicClient.readContract({
    address: CONTRACT_ADDRESSES[chainId]!.Strategy,
    abi: STRATEGY_ABI,
    functionName: 'getPrice',
    args: [pool.key],
  })
  return {
    oraclePrice: formatPrice(
      BigInt(getPriceResult.oraclePrice),
      pool.currencyA.decimals,
      pool.currencyB.decimals,
    ),
    tickA: BigInt(getPriceResult.tickA),
    tickB: BigInt(getPriceResult.tickB),
  }
}
