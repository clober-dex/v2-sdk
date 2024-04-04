import { isAddressEqual, parseUnits, zeroAddress, zeroHash } from 'viem'

import { CHAIN_IDS, CHAIN_MAP } from './constants/chain'
import { PermitSignature, Transaction } from './type'
import { calculateUnit } from './utils/unit'
import { CONTROLLER_ABI } from './abis/core/controller-abi'
import { getDeadlineTimestampInSeconds } from './utils/time'
import { buildTransaction } from './utils/build-transaction'
import { CONTRACT_ADDRESSES } from './constants/addresses'
import { MAKER_DEFAULT_POLICY, TAKER_DEFAULT_POLICY } from './constants/fee'
import { fetchMarket } from './apis/market'
import { parsePrice } from './utils/prices'
import { fromPrice, invertPrice } from './utils/tick'
import { getExpectedOutput } from './view'
import { toBookId } from './utils/book-id'

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
  if ((isBid && !market.bidBookOpen) || (!isBid && !market.askBookOpen)) {
    const unit = await calculateUnit(
      chainId,
      isBid ? market.quote : market.base,
    )
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
              makerPolicy: MAKER_DEFAULT_POLICY.value,
              hooks: zeroAddress,
              takerPolicy: TAKER_DEFAULT_POLICY.value,
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

export const limitOrder = async (
  chainId: CHAIN_IDS,
  userAddress: `0x${string}`,
  inputToken: `0x${string}`,
  outputToken: `0x${string}`,
  amount: string,
  price: string,
  signature?: PermitSignature,
  postOnly?: boolean,
) => {
  const market = await fetchMarket(chainId, [inputToken, outputToken])
  const isBid = isAddressEqual(market.quote.address, inputToken)
  if ((isBid && !market.bidBookOpen) || (!isBid && !market.askBookOpen)) {
    throw new Error(`
       import { openMarket } from '@clober-dex/v2-sdk'

       const transaction = await openMarket(
            ${chainId},
           '${inputToken}',
           '${outputToken}',
       )
    `)
  }

  const rawPrice = parsePrice(
    Number(price),
    market.quote.decimals,
    market.base.decimals,
  )
  const tick = isBid ? fromPrice(rawPrice) : fromPrice(invertPrice(rawPrice))
  const tokensToSettle = [inputToken, outputToken].filter(
    (address) => !isAddressEqual(address, zeroAddress),
  )
  const quoteAmount = parseUnits(
    amount,
    isBid ? market.quote.decimals : market.base.decimals,
  )
  const [unit, { result }] = await Promise.all([
    calculateUnit(chainId, isBid ? market.quote : market.base),
    getExpectedOutput(chainId, inputToken, outputToken, amount, price),
  ])
  const isETH = isAddressEqual(inputToken, zeroAddress)

  const makeParam = {
    id: toBookId(inputToken, outputToken, unit),
    tick,
    quoteAmount,
    hookData: zeroHash,
  }
  if (postOnly === true || result.length === 0) {
    return buildTransaction(chainId, {
      chain: CHAIN_MAP[chainId],
      account: userAddress,
      address: CONTRACT_ADDRESSES[chainId]!.Controller,
      abi: CONTROLLER_ABI,
      functionName: 'make',
      args: [
        [makeParam],
        tokensToSettle,
        [
          {
            token: inputToken,
            permitAmount: !isETH ? quoteAmount : 0n,
            signature: signature!,
          },
        ],
        getDeadlineTimestampInSeconds(),
      ],
      value: isETH ? quoteAmount : 0n,
    })
  } else if (result.length === 1) {
    // take and make
  } else {
    // take x n and make
  }
  return undefined
}
