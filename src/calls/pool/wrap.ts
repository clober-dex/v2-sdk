import { createPublicClient, http, parseUnits } from 'viem'

import { CHAIN_IDS, CHAIN_MAP } from '../../constants/chain-configs/chain'
import {
  CurrencyFlow,
  DefaultWriteContractOptions,
  Transaction,
} from '../../types'
import { fetchPool } from '../../entities/pool/apis'
import { buildTransaction } from '../../utils/build-transaction'
import { CONTRACT_ADDRESSES } from '../../constants/chain-configs/addresses'
import { WRAPPED_6909_FACTORY_ABI } from '../../constants/abis/rebalancer/wrapped-6909-factory-abi'

/**
 * Build a transaction to wrap a pool to ERC20,
 *
 * @param chainId The chain ID of the blockchain.
 * @param userAddress The address of the user.
 * @param token0 The address of the input token.
 * @param token1 The address of the output token.
 * @param salt A unique identifier for the pool, used to prevent collisions.
 * @param amount The amount of the input token to wrap.
 * @param options {@link DefaultWriteContractOptions} options.
 * @returns A Promise resolving to a transaction object. If the market is already open, returns undefined.
 * @example
 * import { wrapToERC20 } from '@clober/v2-sdk'
 *
 * const transaction = await wrapToERC20({
 *   chainId: 421614,
 *   userAddress: '0xF8c1869Ecd4df136693C45EcE1b67f85B6bDaE69',
 *   token0: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
 *   token1: '0x0000000000000000000000000000000000000000',
 *   salt: '0x0000000000000000000000000000000000000000000000000000000000000000',
 *   amount: '1.1',
 * })
 */
export const wrapToERC20 = async ({
  chainId,
  userAddress,
  token0,
  token1,
  salt,
  amount,
  options,
}: {
  chainId: CHAIN_IDS
  userAddress: `0x${string}`
  token0: `0x${string}`
  token1: `0x${string}`
  salt: `0x${string}`
  amount: string
  options?: DefaultWriteContractOptions & {
    useSubgraph?: boolean
  }
}): Promise<{
  transaction: Transaction | undefined
  result: CurrencyFlow | undefined
}> => {
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
  if (pool.isOpened) {
    const address = await publicClient.readContract({
      address: CONTRACT_ADDRESSES[chainId]!.Wrapped6909Factory,
      abi: WRAPPED_6909_FACTORY_ABI,
      functionName: 'getWrapped6909Address',
      args: [CONTRACT_ADDRESSES[chainId]!.Rebalancer, BigInt(pool.key)],
    })
    return {
      result: {
        currency: {
          name: `Wrapped Clober Liquidity Vault ${pool.currencyB.symbol}-${pool.currencyA.symbol}`,
          symbol: `wCLV-${pool.currencyB.symbol}-${pool.currencyA.symbol}`,
          decimals: pool.currencyLp.decimals,
          address,
        },
        amount,
        direction: 'out',
      },
      transaction: await buildTransaction(
        publicClient,
        {
          chain: CHAIN_MAP[chainId],
          address: CONTRACT_ADDRESSES[chainId]!.Wrapped6909Factory,
          account: userAddress,
          abi: WRAPPED_6909_FACTORY_ABI,
          functionName: 'wrap6909',
          args: [
            CONTRACT_ADDRESSES[chainId]!.Rebalancer,
            BigInt(pool.key),
            parseUnits(amount, pool.currencyLp.decimals),
          ],
        },
        options?.gasLimit,
      ),
    }
  }
  return {
    result: undefined,
    transaction: undefined,
  }
}

/**
 * Build a transaction to unwrap a pool from ERC20,
 *
 * @param chainId The chain ID of the blockchain.
 * @param userAddress The address of the user.
 * @param token0 The address of the input token.
 * @param token1 The address of the output token.
 * @param salt A unique identifier for the pool, used to prevent collisions.
 * @param amount The amount of the input token to wrap.
 * @param options {@link DefaultWriteContractOptions} options.
 * @returns A Promise resolving to a transaction object. If the market is already open, returns undefined.
 * @example
 * import { wrapToERC20 } from '@clober/v2-sdk'
 *
 * const transaction = await unwrapFromERC20({
 *   chainId: 421614,
 *   userAddress: '0xF8c1869Ecd4df136693C45EcE1b67f85B6bDaE69',
 *   token0: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
 *   token1: '0x0000000000000000000000000000000000000000',
 *   salt: '0x0000000000000000000000000000000000000000000000000000000000000000',
 *   amount: '1.1',
 * })
 */
export const unwrapFromERC20 = async ({
  chainId,
  userAddress,
  token0,
  token1,
  salt,
  amount,
  options,
}: {
  chainId: CHAIN_IDS
  userAddress: `0x${string}`
  token0: `0x${string}`
  token1: `0x${string}`
  salt: `0x${string}`
  amount: string
  options?: DefaultWriteContractOptions & {
    useSubgraph?: boolean
  }
}): Promise<{
  transaction: Transaction | undefined
  result: CurrencyFlow | undefined
}> => {
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
  if (pool.isOpened) {
    const address = await publicClient.readContract({
      address: CONTRACT_ADDRESSES[chainId]!.Wrapped6909Factory,
      abi: WRAPPED_6909_FACTORY_ABI,
      functionName: 'getWrapped6909Address',
      args: [CONTRACT_ADDRESSES[chainId]!.Rebalancer, BigInt(pool.key)],
    })
    return {
      result: {
        currency: {
          name: `Wrapped Clober Liquidity Vault ${pool.currencyB.symbol}-${pool.currencyA.symbol}`,
          symbol: `wCLV-${pool.currencyB.symbol}-${pool.currencyA.symbol}`,
          decimals: pool.currencyLp.decimals,
          address,
        },
        amount,
        direction: 'in',
      },
      transaction: await buildTransaction(
        publicClient,
        {
          chain: CHAIN_MAP[chainId],
          address,
          account: userAddress,
          abi: [
            {
              type: 'function',
              name: 'withdrawTo',
              inputs: [
                { name: 'account', type: 'address', internalType: 'address' },
                { name: 'amount', type: 'uint256', internalType: 'uint256' },
              ],
              outputs: [],
              stateMutability: 'nonpayable',
            },
          ] as const,
          functionName: 'withdrawTo',
          args: [userAddress, parseUnits(amount, pool.currencyLp.decimals)],
        },
        options?.gasLimit,
      ),
    }
  }
  return {
    result: undefined,
    transaction: undefined,
  }
}
