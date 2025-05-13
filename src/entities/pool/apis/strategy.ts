import { formatUnits, PublicClient } from 'viem'

import { CHAIN_IDS } from '../../../constants/chain'
import { CONTRACT_ADDRESSES } from '../../../constants/addresses'
import { LastAmounts, StrategyPosition } from '../../../type'
import { STRATEGY_ABI } from '../../../constants/abis/rebalancer/strategy-abi'

export async function fetchStrategyPosition(
  publicClient: PublicClient,
  chainId: CHAIN_IDS,
  poolKey: `0x${string}`,
): Promise<StrategyPosition> {
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
  poolKey: `0x${string}`,
): Promise<LastAmounts> {
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
