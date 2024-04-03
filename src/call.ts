import { isAddressEqual, zeroAddress, zeroHash } from 'viem'
import { arbitrumSepolia } from 'viem/chains'

import { CHAIN_IDS } from './constants/chain'
import { Transaction } from './type'
import { fetchMarket } from './apis/market'
import { calculateUnit } from './utils/unit'
import { CONTROLLER_ABI } from './abis/core/controller-abi'
import { getDeadlineTimestampInSeconds } from './utils/time'
import { buildTransaction } from './utils/build-transaction'
import { CONTRACT_ADDRESSES } from './constants/addresses'

/**
 * Build a transaction to open a market.
 *
 * @param chainId The chain ID of the blockchain.
 * @param inputToken The address of the input token.
 * @param outputToken The address of the output token.
 * @returns A Promise resolving to a transaction object. If the market is already open, returns undefined.
 * @example
 * import { openMarket } from '@clober-dex/v2-sdk'
 *
 * const transaction = await openMarket(
 *   421614,
 *  '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0', // USDC
 *  '0x0000000000000000000000000000000000000000', // ETH
 * )
 */
export const openMarket = async (
  chainId: CHAIN_IDS,
  inputToken: `0x${string}`,
  outputToken: `0x${string}`,
): Promise<Transaction | undefined> => {
  const market = await fetchMarket(chainId, [inputToken, outputToken])
  const isBid = isAddressEqual(market.quote.address, inputToken)
  const unit = await calculateUnit(chainId, isBid ? market.quote : market.base)
  if ((isBid && !market.bidBookOpen) || (!isBid && !market.askBookOpen)) {
    return buildTransaction(arbitrumSepolia.id, {
      address: CONTRACT_ADDRESSES[chainId]!.Controller,
      abi: CONTROLLER_ABI,
      functionName: 'open',
      args: [
        [
          {
            key: {
              base: inputToken,
              unit,
              quote: outputToken,
              makerPolicy: 8888308,
              hooks: zeroAddress,
              takerPolicy: 8889608,
            },
            hookData: zeroHash,
          },
        ],
        getDeadlineTimestampInSeconds(),
      ],
    })
  }
  return undefined
}