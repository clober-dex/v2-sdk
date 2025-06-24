import { createPublicClient, http, isAddressEqual } from 'viem'

import { CHAIN_IDS, CHAIN_MAP } from '../../constants/chain-configs/chain'
import {
  DefaultReadContractOptions,
  DefaultWriteContractOptions,
  Market,
  Pool,
} from '../../types'
import { fetchPool } from '../../entities/pool/apis'
import { CONTRACT_ADDRESSES } from '../../constants/chain-configs/addresses'
import { WRAPPED_6909_FACTORY_ABI } from '../../constants/abis/rebalancer/wrapped-6909-factory-abi'

export { getStrategyPrice, getLastAmounts } from './market-making'
export { getPoolSnapshot, getPoolSnapshots } from './snapshot'

/**
 * Get pool information by chain id and token addresses
 * @param chainId - chain id from {@link CHAIN_IDS}
 * @param token0 - token0 address
 * @param token1 - token1 address
 * @param salt - salt for the pool
 * @param options {@link DefaultReadContractOptions} options.
 * @param options.n - number of depth levels to fetch
 * @returns A pool {@link Pool}
 *
 * @example
 * import { getPool } from '@clober/v2-sdk'
 *
 * const market = await getPool({
 *   chainId: 421614,
 *   token0: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
 *   token1: '0x0000000000000000000000000000000000000000',
 *   salt: '0x0000000000000000000000000000000000000000000000000000000000000000',
 * })
 */
export const getPool = async ({
  chainId,
  token0,
  token1,
  salt,
  options,
}: {
  chainId: CHAIN_IDS
  token0: `0x${string}`
  token1: `0x${string}`
  salt: `0x${string}`
  options?: {
    market?: Market
    n?: number
    useSubgraph?: boolean
  } & DefaultReadContractOptions
}): Promise<Pool> => {
  if (isAddressEqual(token0, token1)) {
    throw new Error('Token0 and token1 must be different')
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
    options?.market,
  )
  if (!pool.isOpened) {
    throw new Error('Pool is not opened')
  }
  return pool.toJson()
}

export const getLpWrappedERC20Address = ({
  chainId,
  poolKey,
  options,
}: {
  chainId: CHAIN_IDS
  poolKey: `0x${string}`
  options?: DefaultWriteContractOptions & {
    useSubgraph?: boolean
  }
}) => {
  const publicClient = createPublicClient({
    chain: CHAIN_MAP[chainId],
    transport: options?.rpcUrl ? http(options.rpcUrl) : http(),
  })
  return publicClient.readContract({
    address: CONTRACT_ADDRESSES[chainId]!.Wrapped6909Factory,
    abi: WRAPPED_6909_FACTORY_ABI,
    functionName: 'getWrapped6909Address',
    args: [CONTRACT_ADDRESSES[chainId]!.Rebalancer, BigInt(poolKey)],
  })
}
