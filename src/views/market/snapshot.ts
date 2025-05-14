import { createPublicClient, http } from 'viem'

import { CHAIN_IDS, CHAIN_MAP } from '../../constants/chain-configs/chain'
import { DefaultReadContractOptions, MarketSnapshot } from '../../types'
import {
  fetchMarketSnapshot,
  fetchMarketSnapshots,
} from '../../entities/market/apis/snapshot'
import {
  currentTimestampInSeconds,
  getDailyStartTimestampInSeconds,
} from '../../utils/time'

export const getMarketSnapshot = async ({
  chainId,
  token0,
  token1,
  options,
}: {
  chainId: CHAIN_IDS
  token0: `0x${string}`
  token1: `0x${string}`
  options?: DefaultReadContractOptions & { timestampInSeconds?: number }
}): Promise<MarketSnapshot> => {
  const publicClient = createPublicClient({
    chain: CHAIN_MAP[chainId],
    transport: options?.rpcUrl ? http(options.rpcUrl) : http(),
  })
  return fetchMarketSnapshot(
    publicClient,
    chainId,
    token0,
    token1,
    options && options.timestampInSeconds
      ? getDailyStartTimestampInSeconds(options.timestampInSeconds)
      : currentTimestampInSeconds(),
  )
}

export const getMarketSnapshots = async ({
  chainId,
  options,
}: {
  chainId: CHAIN_IDS
  options?: DefaultReadContractOptions & { timestampInSeconds?: number }
}): Promise<MarketSnapshot[]> => {
  const publicClient = createPublicClient({
    chain: CHAIN_MAP[chainId],
    transport: options?.rpcUrl ? http(options.rpcUrl) : http(),
  })
  return fetchMarketSnapshots(
    publicClient,
    chainId,
    options && options.timestampInSeconds
      ? getDailyStartTimestampInSeconds(options.timestampInSeconds)
      : currentTimestampInSeconds(),
  )
}
