import {
  encodeAbiParameters,
  isAddressEqual,
  parseUnits,
  zeroAddress,
  zeroHash,
} from 'viem'

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
import {
  MAKE_ORDER_PARAMS_ABI,
  TAKE_ORDER_PARAMS_ABI,
} from './abis/core/params-abi'
import { Action } from './constants/action'

/**
 * Build a transaction to open a market.
 *
 * @param chainId The chain ID of the blockchain.
 * @param inputToken The address of the input token.
 * @param outputToken The address of the output token.
 * @param options
 * @param options.rpcUrl The RPC URL of the blockchain.
 * @returns A Promise resolving to a transaction object. If the market is already open, returns undefined.
 * @example
 * import { openMarket } from '@clober-dex/v2-sdk'
 *
 * const transaction = await openMarket(
 *   421614,
 *  '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
 *  '0x0000000000000000000000000000000000000000'
 * )
 */
export const openMarket = async (
  chainId: CHAIN_IDS,
  inputToken: `0x${string}`,
  outputToken: `0x${string}`,
  options?: {
    rpcUrl?: string
  },
): Promise<Transaction | undefined> => {
  const market = await fetchMarket(
    chainId,
    [inputToken, outputToken],
    options?.rpcUrl,
  )
  const isBid = isAddressEqual(market.quote.address, inputToken)
  if ((isBid && !market.bidBookOpen) || (!isBid && !market.askBookOpen)) {
    const unit = await calculateUnit(
      chainId,
      isBid ? market.quote : market.base,
      options?.rpcUrl,
    )
    return buildTransaction(
      chainId,
      {
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
      },
      options?.rpcUrl,
    )
  }
  return undefined
}

/**
 * Places a limit order on the specified chain for trading tokens.
 *
 * @param {CHAIN_IDS} chainId The chain ID.
 * @param {`0x${string}`} userAddress The Ethereum address of the user placing the order.
 * @param {`0x${string}`} inputToken The address of the token to be used as input.
 * @param {`0x${string}`} outputToken The address of the token to be received as output.
 * @param {string} amount The amount of input tokens for the order.
 * @param {string} price The price at which the order should be executed.
 * @param {Object} [options] Optional parameters for the limit order.
 * @param {PermitSignature} [options.signature] The permit signature for token approval.
 * @param {boolean} [options.postOnly] A boolean indicating whether the order is only to be made not taken.
 * @param {string} [options.rpcUrl] The RPC URL of the blockchain.
 * @returns {Promise<Transaction>} Promise resolving to the transaction object representing the limit order.
 * @example
 * import { signERC20Permit, limitOrder } from '@clober-dex/v2-sdk'
 * import { privateKeyToAccount } from 'viem/accounts'
 *
 * const signature = await signERC20Permit(
 *   421614,
 *   privateKeyToAccount('0x...'),
 *   '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
 *   '100.123'
 * )
 *
 * const transaction = await limitOrder(
 *   421614,
 *  '0xF8c1869Ecd4df136693C45EcE1b67f85B6bDaE69
 *  '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
 *  '0x0000000000000000000000000000000000000000',
 *  '100.123', // 100.123 USDC
 *  '4000.01', // price at 4000.01 (ETH/USDC)
 *  { signature }
 * )
 *
 * @example
 * import { limitOrder } from '@clober-dex/v2-sdk'
 *
 * const transaction = await limitOrder(
 *   421614,
 *  '0xF8c1869Ecd4df136693C45EcE1b67f85B6bDaE69
 *  '0x0000000000000000000000000000000000000000',
 *  '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
 *  '0.13', // 0.13 ETH
 *  '4000.01', // price at 4000.01 (ETH/USDC)
 * )
 */
export const limitOrder = async (
  chainId: CHAIN_IDS,
  userAddress: `0x${string}`,
  inputToken: `0x${string}`,
  outputToken: `0x${string}`,
  amount: string,
  price: string,
  options?: {
    signature?: PermitSignature
    postOnly?: boolean
    rpcUrl?: string
  },
): Promise<Transaction> => {
  const { signature, postOnly, rpcUrl } = options || {
    signature: undefined,
    postOnly: false,
    rpcUrl: undefined,
  }
  const market = await fetchMarket(chainId, [inputToken, outputToken], rpcUrl)
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
    calculateUnit(chainId, isBid ? market.quote : market.base, rpcUrl),
    getExpectedOutput(
      chainId,
      inputToken,
      outputToken,
      amount,
      rpcUrl
        ? {
            limitPrice: price,
            rpcUrl,
          }
        : {
            limitPrice: price,
          },
    ),
  ])
  const isETH = isAddressEqual(inputToken, zeroAddress)
  const permitParamsList =
    signature && !isETH
      ? [
          {
            token: inputToken,
            permitAmount: quoteAmount,
            signature,
          },
        ]
      : []

  const makeParam = {
    id: toBookId(inputToken, outputToken, unit),
    tick: Number(tick),
    quoteAmount,
    hookData: zeroHash,
  }
  if (postOnly === true || result.length === 0) {
    return buildTransaction(
      chainId,
      {
        chain: CHAIN_MAP[chainId],
        account: userAddress,
        address: CONTRACT_ADDRESSES[chainId]!.Controller,
        abi: CONTROLLER_ABI,
        functionName: 'make',
        args: [
          [makeParam],
          tokensToSettle,
          permitParamsList,
          getDeadlineTimestampInSeconds(),
        ],
        value: isETH ? quoteAmount : 0n,
      },
      options?.rpcUrl,
    )
  } else if (result.length === 1) {
    // take and make
    return buildTransaction(
      chainId,
      {
        chain: CHAIN_MAP[chainId],
        account: userAddress,
        address: CONTRACT_ADDRESSES[chainId]!.Controller,
        abi: CONTROLLER_ABI,
        functionName: 'limit',
        args: [
          [
            {
              takeBookId: result[0]!.bookId,
              makeBookId: makeParam.id,
              limitPrice: rawPrice,
              tick: makeParam.tick,
              quoteAmount,
              takeHookData: zeroHash,
              makeHookData: makeParam.hookData,
            },
          ],
          tokensToSettle,
          permitParamsList,
          getDeadlineTimestampInSeconds(),
        ],
        value: isETH ? quoteAmount : 0n,
      },
      options?.rpcUrl,
    )
  } else {
    // take x n and make
    const makeAmount =
      quoteAmount -
      result.reduce((acc, { spendAmount }) => acc + spendAmount, 0n)
    return buildTransaction(
      chainId,
      {
        chain: CHAIN_MAP[chainId],
        account: userAddress,
        address: CONTRACT_ADDRESSES[chainId]!.Controller,
        abi: CONTROLLER_ABI,
        functionName: 'execute',
        args: [
          [
            ...result.map(() => Action.TAKE),
            ...(makeAmount > 0n ? [Action.MAKE] : []),
          ],
          [
            ...result.map(({ bookId, takenAmount }) =>
              encodeAbiParameters(TAKE_ORDER_PARAMS_ABI, [
                {
                  id: bookId,
                  limitPrice: rawPrice,
                  quoteAmount: takenAmount,
                  hookData: zeroHash,
                },
              ]),
            ),
            ...(makeAmount > 0n
              ? [
                  encodeAbiParameters(MAKE_ORDER_PARAMS_ABI, [
                    {
                      ...makeParam,
                      quoteAmount: makeAmount,
                    },
                  ]),
                ]
              : []),
          ],
          tokensToSettle,
          permitParamsList,
          [],
          getDeadlineTimestampInSeconds(),
        ],
        value: isETH ? quoteAmount : 0n,
      },
      options?.rpcUrl,
    )
  }
}

/**
 * Executes a market order on the specified chain for trading tokens.
 *
 * @param {CHAIN_IDS} chainId The chain ID.
 * @param {`0x${string}`} userAddress The Ethereum address of the user placing the order.
 * @param {`0x${string}`} inputToken The address of the token to be used as input.
 * @param {`0x${string}`} outputToken The address of the token to be received as output.
 * @param {string} amount The amount of input tokens for the order.
 * @param {Object} [options] Optional parameters for the market order.
 * @param {PermitSignature} [options.signature] The permit signature for token approval.
 * @param {string} [options.rpcUrl] The RPC URL to use for executing the order.
 * @returns {Promise<void>} Promise resolving once the market order is executed.
 */

export const marketOrder = async (
  chainId: CHAIN_IDS,
  userAddress: `0x${string}`,
  inputToken: `0x${string}`,
  outputToken: `0x${string}`,
  amount: string,
  options?: {
    signature?: PermitSignature
    rpcUrl?: string
  },
): Promise<Transaction> => {
  const { signature, rpcUrl } = options || {
    signature: undefined,
    rpcUrl: undefined,
  }
  const market = await fetchMarket(chainId, [inputToken, outputToken], rpcUrl)
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

  const tokensToSettle = [inputToken, outputToken].filter(
    (address) => !isAddressEqual(address, zeroAddress),
  )
  const quoteAmount = parseUnits(
    amount,
    isBid ? market.quote.decimals : market.base.decimals,
  )
  const { result } = await getExpectedOutput(
    chainId,
    inputToken,
    outputToken,
    amount,
    rpcUrl
      ? {
          rpcUrl,
        }
      : {},
  )
  const isETH = isAddressEqual(inputToken, zeroAddress)
  const permitParamsList =
    signature && !isETH
      ? [
          {
            token: inputToken,
            permitAmount: quoteAmount,
            signature,
          },
        ]
      : []

  return buildTransaction(
    chainId,
    {
      chain: CHAIN_MAP[chainId],
      account: userAddress,
      address: CONTRACT_ADDRESSES[chainId]!.Controller,
      abi: CONTROLLER_ABI,
      functionName: 'take',
      args: [
        result.map(({ bookId, takenAmount }) => ({
          id: bookId,
          limitPrice: 0n,
          quoteAmount: takenAmount,
          hookData: zeroHash,
        })),
        tokensToSettle,
        permitParamsList,
        getDeadlineTimestampInSeconds(),
      ],
      value: isETH ? quoteAmount : 0n,
    },
    options?.rpcUrl,
  )
}
