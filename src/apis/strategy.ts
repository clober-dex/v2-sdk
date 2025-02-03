import { formatUnits, PublicClient } from 'viem'

import { CHAIN_IDS } from '../constants/chain'
import { CONTRACT_ADDRESSES } from '../constants/addresses'
import { LastAmounts, Market, StrategyPosition } from '../type'
import { STRATEGY_ABI } from '../abis/rebalancer/strategy-abi'
import { toPoolKey } from '../utils/pool-key'

import { fetchPool } from './pool'

export async function fetchStrategyPosition(
  publicClient: PublicClient,
  chainId: CHAIN_IDS,
  tokenAddresses: `0x${string}`[],
  salt: `0x${string}`,
  useSubgraph: boolean,
  market?: Market,
): Promise<StrategyPosition> {
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
    functionName: 'getPosition',
    args: [poolKey],
  })
  return {
    oraclePrice: BigInt(getPriceResult.oraclePrice),
    rate: formatUnits(BigInt(getPriceResult.rate), 6),
    bidTick: BigInt(getPriceResult.tickA),
    askTick: BigInt(getPriceResult.tickB),
  }
}

export async function fetchLastAmounts(
  publicClient: PublicClient,
  chainId: CHAIN_IDS,
  tokenAddresses: `0x${string}`[],
  salt: `0x${string}`,
  useSubgraph: boolean,
  market?: Market,
): Promise<LastAmounts> {
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
  const getLastAmount = await publicClient.readContract({
    address: CONTRACT_ADDRESSES[chainId]!.Strategy,
    abi: STRATEGY_ABI,
    functionName: 'getLastAmount',
    args: [poolKey],
  })
  return {
    lastAmountA: BigInt(getLastAmount[0]),
    lastAmountB: BigInt(getLastAmount[1]),
  }
}
