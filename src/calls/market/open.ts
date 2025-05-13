import {
  createPublicClient,
  http,
  isAddressEqual,
  zeroAddress,
  zeroHash,
} from 'viem'

import { CHAIN_IDS, CHAIN_MAP } from '../../constants/chain-configs/chain'
import { DefaultWriteContractOptions, Transaction } from '../../types'
import { fetchMarket } from '../../entities/market/apis'
import { calculateUnitSize } from '../../utils/unit-size'
import { CONTRACT_ADDRESSES } from '../../constants/chain-configs/addresses'
import { CONTROLLER_ABI } from '../../constants/abis/core/controller-abi'
import {
  MAKER_DEFAULT_POLICY,
  TAKER_DEFAULT_POLICY,
} from '../../constants/chain-configs/fee'
import { getDeadlineTimestampInSeconds } from '../../utils/time'
import { buildTransaction } from '../../utils/build-transaction'

/**
 * Build a transaction to open a market.
 *
 * @param chainId The chain ID of the blockchain.
 * @param userAddress The address of the user.
 * @param inputToken The address of the input token.
 * @param outputToken The address of the output token.
 * @param options {@link DefaultWriteContractOptions} options.
 * @returns A Promise resolving to a transaction object. If the market is already open, returns undefined.
 * @example
 * import { openMarket } from '@clober/v2-sdk'
 *
 * const transaction = await openMarket({
 *   chainId: 421614,
 *   userAddress: '0xF8c1869Ecd4df136693C45EcE1b67f85B6bDaE69',
 *   inputToken: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
 *   outputToken: '0x0000000000000000000000000000000000000000'
 * })
 */
export const openMarket = async ({
  chainId,
  userAddress,
  inputToken,
  outputToken,
  options,
}: {
  chainId: CHAIN_IDS
  userAddress: `0x${string}`
  inputToken: `0x${string}`
  outputToken: `0x${string}`
  options?: DefaultWriteContractOptions & {
    useSubgraph?: boolean
  }
}): Promise<Transaction | undefined> => {
  const publicClient = createPublicClient({
    chain: CHAIN_MAP[chainId],
    transport: options?.rpcUrl ? http(options.rpcUrl) : http(),
  })
  const market = await fetchMarket(
    publicClient,
    chainId,
    [inputToken, outputToken],
    !!(options && options.useSubgraph),
  )
  const isBid = isAddressEqual(market.quote.address, inputToken)
  if (
    (isBid && !market.bidBook.isOpened) ||
    (!isBid && !market.askBook.isOpened)
  ) {
    const unitSize = calculateUnitSize(
      chainId,
      isBid ? market.quote : market.base,
    )
    return buildTransaction(
      publicClient,
      {
        chain: CHAIN_MAP[chainId],
        address: CONTRACT_ADDRESSES[chainId]!.Controller,
        account: userAddress,
        abi: CONTROLLER_ABI,
        functionName: 'open',
        args: [
          [
            {
              key: {
                base: outputToken,
                unitSize,
                quote: inputToken,
                makerPolicy: MAKER_DEFAULT_POLICY[chainId].value,
                hooks: zeroAddress,
                takerPolicy: TAKER_DEFAULT_POLICY[chainId].value,
              },
              hookData: zeroHash,
            },
          ],
          getDeadlineTimestampInSeconds(),
        ],
      },
      options?.gasLimit,
    )
  }
  return undefined
}
