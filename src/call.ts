import { zeroAddress, zeroHash } from 'viem'

import { CHAIN_IDS } from './constants/chain'
import { Transaction } from './type'
import { calculateUnit } from './utils/unit'
import { CONTROLLER_ABI } from './abis/core/controller-abi'
import { getDeadlineTimestampInSeconds } from './utils/time'
import { buildTransaction } from './utils/build-transaction'
import { CONTRACT_ADDRESSES } from './constants/addresses'
import { MAKER_DEFAULT_POLICY, TAKER_DEFAULT_POLICY } from './constants/fee'
import { isOpen } from './utils/book'
import { fetchCurrency } from './apis/currency'

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
  const inputCurrency = await fetchCurrency(chainId, inputToken)
  const unit = await calculateUnit(chainId, inputCurrency)
  const open = await isOpen(chainId, inputToken, outputToken, unit)
  if (!open) {
    return buildTransaction(chainId, {
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
              makerPolicy: MAKER_DEFAULT_POLICY.rate,
              hooks: zeroAddress,
              takerPolicy: TAKER_DEFAULT_POLICY.rate,
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
