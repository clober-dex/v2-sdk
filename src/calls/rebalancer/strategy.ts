import { createPublicClient, http, parseUnits } from 'viem'

import { CHAIN_IDS, CHAIN_MAP } from '../../constants/chain'
import { DefaultWriteContractOptions, Transaction } from '../../type'
import { fetchPool } from '../../entities/pool/apis'
import { buildTransaction } from '../../entities/utils/build-transaction'
import { CONTRACT_ADDRESSES } from '../../constants/addresses'
import { STRATEGY_ABI } from '../../constants/abis/rebalancer/strategy-abi'

export const setStrategyConfig = async ({
  chainId,
  userAddress,
  token0,
  token1,
  salt,
  config,
  options,
}: {
  chainId: CHAIN_IDS
  userAddress: `0x${string}`
  token0: `0x${string}`
  token1: `0x${string}`
  salt: `0x${string}`
  config: {
    referenceThreshold: string // 0 <= referenceThreshold <= 1
    rebalanceThreshold: string // 0 <= rebalanceThreshold <= 1
    rateA: string // 0 <= rateA <= 1
    rateB: string // 0 <= rateB <= 1
    minRateA: string // 0 <= minRateA <= rateA
    minRateB: string // 0 <= minRateB <= rateB
    priceThresholdA: string // 0 <= priceThresholdA <= 1
    priceThresholdB: string // 0 <= priceThresholdB <= 1
  }
  options?: {
    useSubgraph?: boolean
  } & DefaultWriteContractOptions
}): Promise<Transaction> => {
  // validate config
  if (
    Number(config.referenceThreshold) < 0 ||
    Number(config.referenceThreshold) > 1
  ) {
    throw new Error('Reference threshold must be in the range [0, 1]')
  }
  if (
    Number(config.rebalanceThreshold) < 0 ||
    Number(config.rebalanceThreshold) > 1
  ) {
    throw new Error('Rebalance threshold must be in the range [0, 1]')
  }
  if (
    Number(config.priceThresholdA) < 0 ||
    Number(config.priceThresholdA) > 1 ||
    Number(config.priceThresholdB) < 0 ||
    Number(config.priceThresholdB) > 1
  ) {
    throw new Error('Price threshold must be in the range [0, 1]')
  }
  if (
    Number(config.rateA) < 0 ||
    Number(config.rateA) > 1 ||
    Number(config.rateB) < 0 ||
    Number(config.rateB) > 1
  ) {
    throw new Error('Rate must be in the range [0, 1]')
  }
  if (
    Number(config.minRateA) < 0 ||
    Number(config.minRateA) > 1 ||
    Number(config.minRateB) < 0 ||
    Number(config.minRateB) > 1
  ) {
    throw new Error('Min rate must be in the range [0, 1]')
  }
  if (
    Number(config.minRateA) > Number(config.rateA) ||
    Number(config.minRateB) > Number(config.rateB)
  ) {
    throw new Error('Min rate must be less or equal to rate')
  }
  const publicClient = createPublicClient({
    chain: CHAIN_MAP[chainId],
    transport: options?.rpcUrl ? http(options.rpcUrl) : http(),
  })
  const pool = await fetchPool(
    publicClient,
    chainId,
    [token0, token1],
    salt,
    !!(options && options.useSubgraph),
  )
  if (!pool.isOpened) {
    throw new Error(`
       Open the pool before set strategy config.
       import { openPool } from '@clober/v2-sdk'

       const transaction = await openPool({
            chainId: ${chainId},
            tokenA: '${token0}',
            tokenB: '${token1}',
       })
    `)
  }

  const configRaw = {
    referenceThreshold: parseUnits(config.referenceThreshold, 6),
    rebalanceThreshold: parseUnits(config.rebalanceThreshold, 6),
    rateA: parseUnits(config.rateA, 6),
    rateB: parseUnits(config.rateB, 6),
    minRateA: parseUnits(config.minRateA, 6),
    minRateB: parseUnits(config.minRateB, 6),
    priceThresholdA: parseUnits(config.priceThresholdA, 6),
    priceThresholdB: parseUnits(config.priceThresholdB, 6),
  }
  return buildTransaction(
    publicClient,
    {
      chain: CHAIN_MAP[chainId],
      account: userAddress,
      address: CONTRACT_ADDRESSES[chainId]!.Strategy,
      abi: STRATEGY_ABI,
      functionName: 'setConfig',
      args: [pool.key, configRaw],
    },
    options?.gasLimit,
  )
}
