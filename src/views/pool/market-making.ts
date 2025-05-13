import { createPublicClient, http } from 'viem'

import { CHAIN_IDS, CHAIN_MAP } from '../../constants/chain'
import {
  DefaultReadContractOptions,
  LastAmounts,
  StrategyPosition,
} from '../../types'
import {
  fetchLastAmounts,
  fetchStrategyPosition,
} from '../../entities/pool/apis/strategy'

export const getStrategyPrice = async ({
  chainId,
  poolKey,
  options,
}: {
  chainId: CHAIN_IDS
  poolKey: `0x${string}`
  options?: DefaultReadContractOptions
}): Promise<StrategyPosition> => {
  const publicClient = createPublicClient({
    chain: CHAIN_MAP[chainId],
    transport: options?.rpcUrl ? http(options.rpcUrl) : http(),
  })
  return fetchStrategyPosition(publicClient, chainId, poolKey)
}

export const getLastAmounts = async ({
  chainId,
  poolKey,
  options,
}: {
  chainId: CHAIN_IDS
  poolKey: `0x${string}`
  options?: DefaultReadContractOptions
}): Promise<LastAmounts> => {
  const publicClient = createPublicClient({
    chain: CHAIN_MAP[chainId],
    transport: options?.rpcUrl ? http(options.rpcUrl) : http(),
  })
  return fetchLastAmounts(publicClient, chainId, poolKey)
}
