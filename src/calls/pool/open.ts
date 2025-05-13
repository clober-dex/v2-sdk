import { createPublicClient, http, zeroAddress } from 'viem'

import { CHAIN_IDS, CHAIN_MAP } from '../../constants/chain'
import { DefaultWriteContractOptions, Transaction } from '../../type'
import { fetchPool } from '../../entities/pool/apis'
import { buildTransaction } from '../../entities/utils/build-transaction'
import { CONTRACT_ADDRESSES } from '../../constants/addresses'
import { REBALANCER_ABI } from '../../constants/abis/rebalancer/rebalancer-abi'
import { MAKER_DEFAULT_POLICY, TAKER_DEFAULT_POLICY } from '../../constants/fee'
import { toBytes32 } from '../../entities/pool/utils/mint'

/**
 * Build a transaction to open a pool,
 *
 * @param chainId The chain ID of the blockchain.
 * @param userAddress The address of the user.
 * @param inputToken The address of the input token.
 * @param outputToken The address of the output token.
 * @param options {@link DefaultWriteContractOptions} options.
 * @returns A Promise resolving to a transaction object. If the market is already open, returns undefined.
 * @example
 * import { openPool } from '@clober/v2-sdk'
 *
 * const transaction = await openPool({
 *   chainId: 421614,
 *   userAddress: '0xF8c1869Ecd4df136693C45EcE1b67f85B6bDaE69',
 *   inputToken: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
 *   outputToken: '0x0000000000000000000000000000000000000000',
 *   salt: '0x0000000000000000000000000000000000000000000000000000000000000000',
 * })
 */
export const openPool = async ({
  chainId,
  userAddress,
  tokenA,
  tokenB,
  salt,
  options,
}: {
  chainId: CHAIN_IDS
  userAddress: `0x${string}`
  tokenA: `0x${string}`
  tokenB: `0x${string}`
  salt: `0x${string}`
  options?: DefaultWriteContractOptions & {
    useSubgraph?: boolean
  }
}): Promise<Transaction | undefined> => {
  const publicClient = createPublicClient({
    chain: CHAIN_MAP[chainId],
    transport: options?.rpcUrl ? http(options.rpcUrl) : http(),
  })
  const pool = await fetchPool(
    publicClient,
    chainId,
    [tokenA, tokenB],
    salt,
    !!(options && options.useSubgraph),
  )
  if (!pool.isOpened) {
    return buildTransaction(
      publicClient,
      {
        chain: CHAIN_MAP[chainId],
        address: CONTRACT_ADDRESSES[chainId]!.Rebalancer,
        account: userAddress,
        abi: REBALANCER_ABI,
        functionName: 'open',
        args: [
          {
            base: pool.market.bidBook.base.address,
            unitSize: pool.market.bidBook.unitSize,
            quote: pool.market.bidBook.quote.address,
            makerPolicy: MAKER_DEFAULT_POLICY[chainId].value,
            hooks: zeroAddress,
            takerPolicy: TAKER_DEFAULT_POLICY[chainId].value,
          },
          {
            base: pool.market.askBook.base.address,
            unitSize: pool.market.askBook.unitSize,
            quote: pool.market.askBook.quote.address,
            makerPolicy: MAKER_DEFAULT_POLICY[chainId].value,
            hooks: zeroAddress,
            takerPolicy: TAKER_DEFAULT_POLICY[chainId].value,
          },
          toBytes32(salt),
          CONTRACT_ADDRESSES[chainId]!.Strategy,
        ],
      },
      options?.gasLimit,
    )
  }
  return undefined
}
