import { createPublicClient, http } from 'viem'

import { CHAIN_IDS, CHAIN_MAP } from '../../constants/chain'
import { DefaultWriteContractOptions, Pool, Transaction } from '../../type'
import { fetchPool } from '../../entities/pool/apis'
import { buildTransaction } from '../../utils/build-transaction'
import { CONTRACT_ADDRESSES } from '../../constants/addresses'
import { REBALANCER_ABI } from '../../abis/rebalancer/rebalancer-abi'

export const refillOrder = async ({
  chainId,
  userAddress,
  token0,
  token1,
  salt,
  options,
}: {
  chainId: CHAIN_IDS
  userAddress: `0x${string}`
  token0: `0x${string}`
  token1: `0x${string}`
  salt: `0x${string}`
  options?: DefaultWriteContractOptions & {
    useSubgraph?: boolean
    pool?: Pool
  }
}): Promise<Transaction> => {
  const publicClient = createPublicClient({
    chain: CHAIN_MAP[chainId],
    transport: options?.rpcUrl ? http(options.rpcUrl) : http(),
  })
  const pool = options?.pool
    ? options.pool
    : (
        await fetchPool(
          publicClient,
          chainId,
          [token0, token1],
          salt,
          !!(options && options.useSubgraph),
        )
      ).toJson()
  if (!pool.isOpened) {
    throw new Error(`
       Open the pool before rebalancing pool.
       import { openPool } from '@clober/v2-sdk'

       const transaction = await openPool({
            chainId: ${chainId},
            tokenA: '${token0}',
            tokenB: '${token1}',
            salt: '0x0000000000000000000000000000000000000000000000000000000000000000',
       })
    `)
  }

  return buildTransaction(
    publicClient,
    {
      chain: CHAIN_MAP[chainId],
      account: userAddress,
      address: CONTRACT_ADDRESSES[chainId]!.Rebalancer,
      abi: REBALANCER_ABI,
      functionName: 'rebalance',
      args: [pool.key],
    },
    options?.gasLimit,
    options?.gasPriceLimit,
  )
}
