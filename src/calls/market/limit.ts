import {
  createPublicClient,
  formatUnits,
  http,
  isAddressEqual,
  parseUnits,
  zeroAddress,
  zeroHash,
} from 'viem'

import { CHAIN_IDS, CHAIN_MAP } from '../../constants/chain-configs/chain'
import {
  CurrencyFlow,
  DefaultWriteContractOptions,
  ERC20PermitParam,
  Transaction,
} from '../../types'
import { fetchMarket } from '../../entities/market/apis'
import { formatPrice, parsePrice } from '../../utils/prices'
import { calculateUnitSize } from '../../utils/unit-size'
import { getExpectedOutput } from '../../views'
import { toBookId } from '../../entities/book/utils/book-id'
import { invertTick, toPrice } from '../../utils/tick'
import { buildTransaction } from '../../utils/build-transaction'
import { CONTRACT_ADDRESSES } from '../../constants/chain-configs/addresses'
import { CONTROLLER_ABI } from '../../constants/abis/core/controller-abi'
import { getDeadlineTimestampInSeconds } from '../../utils/time'

/**
 * Places a limit order on the specified chain for trading tokens.
 *
 * @param {CHAIN_IDS} chainId The chain ID.
 * @param {`0x${string}`} userAddress The Ethereum address of the user placing the order.
 * @param {`0x${string}`} inputToken The address of the token to be used as input.
 * @param {`0x${string}`} outputToken The address of the token to be received as output.
 * @param {string} amount The amount of input tokens for the order.
 * @param {string} price The price at which the order should be executed.
 * @param options {@link DefaultWriteContractOptions} options.
 * @param {erc20PermitParam} [options.erc20PermitParam] The permit signature for token approval.
 * @param {boolean} [options.postOnly] A boolean indicating whether the order is only to be made not taken.
 * @param {bigint} [options.makeTick] The tick for the make order.
 * @param {bigint} [options.takeLimitTick] The tick for the take order.
 * @param {boolean} [options.roundingUpMakeBid] A boolean indicating whether to round up the make bid.
 * @param {boolean} [options.roundingDownMakeAsk] A boolean indicating whether to round down the make ask.
 * @param {boolean} [options.roundingDownTakenBid] A boolean indicating whether to round down the taken bid.
 * @param {boolean} [options.roundingUpTakenAsk] A boolean indicating whether to round up the taken ask.
 * @returns {Promise<{ transaction: Transaction, result: { make: CurrencyFlow, take: CurrencyFlow, spent: CurrencyFlow }>}
 * Promise resolving to the transaction object representing the limit order with the result of the order.
 * @example
 * import { limitOrder } from '@clober/v2-sdk'
 * import { privateKeyToAccount } from 'viem/accounts'
 *
 * const { transaction } = await limitOrder({
 *   chainId: 421614,
 *   userAddress: '0xF8c1869Ecd4df136693C45EcE1b67f85B6bDaE69
 *   inputToken: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
 *   outputToken: '0x0000000000000000000000000000000000000000',
 *   amount: '100.123', // 100.123 USDC
 *   price: '4000.01', // price at 4000.01 (ETH/USDC)
 * })
 *
 * @example
 * import { limitOrder } from '@clober/v2-sdk'
 *
 * const { transaction } = await limitOrder({
 *   chainId: 421614,
 *   userAddress: '0xF8c1869Ecd4df136693C45EcE1b67f85B6bDaE69
 *   inputToken: '0x0000000000000000000000000000000000000000',
 *   outputToken: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
 *   amount: '0.13', // 0.13 ETH
 *   price: '4000.01', // price at 4000.01 (ETH/USDC)
 * })
 */
export const limitOrder = async ({
  chainId,
  userAddress,
  inputToken,
  outputToken,
  amount,
  price,
  options,
}: {
  chainId: CHAIN_IDS
  userAddress: `0x${string}`
  inputToken: `0x${string}`
  outputToken: `0x${string}`
  amount: string
  price: string
  options?: {
    erc20PermitParam?: ERC20PermitParam
    postOnly?: boolean
    makeTick?: bigint
    takeLimitTick?: bigint
    roundingUpMakeBid?: boolean
    roundingDownMakeAsk?: boolean
    roundingDownTakenBid?: boolean
    roundingUpTakenAsk?: boolean
    useSubgraph?: boolean
  } & DefaultWriteContractOptions
}): Promise<{
  transaction: Transaction
  result: {
    make: CurrencyFlow & { price: string }
    taken: CurrencyFlow & { events: { price: string; amount: string }[] }
    spent: CurrencyFlow & { events: { price: string; amount: string }[] }
  }
}> => {
  const [
    roundingUpMakeBid,
    roundingDownMakeAsk,
    roundingDownTakenBid,
    roundingUpTakenAsk,
  ] = [
    options?.roundingUpMakeBid ? options.roundingUpMakeBid : false,
    options?.roundingDownMakeAsk ? options.roundingDownMakeAsk : false,
    options?.roundingDownTakenBid ? options.roundingDownTakenBid : false,
    options?.roundingUpTakenAsk ? options.roundingUpTakenAsk : false,
  ]
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
  const [inputCurrency, outputCurrency] = isBid
    ? [market.quote, market.base]
    : [market.base, market.quote]
  if (
    (isBid && !market.bidBook.isOpened) ||
    (!isBid && !market.askBook.isOpened)
  ) {
    throw new Error(`
       Open the market before placing a limit order.
       import { openMarket } from '@clober/v2-sdk'

       const transaction = await openMarket({
            chainId: ${chainId},
            inputToken: '${inputToken}',
            outputToken: '${outputToken}',
       })
    `)
  }

  const { roundingDownTick, roundingUpTick } = parsePrice(
    Number(price),
    market.quote.decimals,
    market.base.decimals,
  )
  const tokensToSettle = [inputToken, outputToken].filter(
    (address) => !isAddressEqual(address, zeroAddress),
  )
  const quoteAmount = parseUnits(amount, inputCurrency.decimals)
  const unitSize = calculateUnitSize(chainId, inputCurrency)
  const { takenAmount, spentAmount, bookId, events } = await getExpectedOutput({
    chainId,
    inputToken,
    outputToken,
    amountIn: amount,
    options: {
      ...options,
      limitPrice: price,
    },
  })
  const isETH = isAddressEqual(inputToken, zeroAddress)
  const makeParam = {
    id: toBookId(chainId, inputToken, outputToken, unitSize),
    tick: options?.makeTick
      ? Number(options.makeTick)
      : Number(
          isBid
            ? roundingUpMakeBid
              ? roundingUpTick
              : roundingDownTick
            : invertTick(
                roundingDownMakeAsk ? roundingDownTick : roundingUpTick,
              ),
        ),
    quoteAmount,
    hookData: zeroHash,
  }
  if (options?.postOnly === true || spentAmount === '0') {
    return {
      transaction: await buildTransaction(
        publicClient,
        {
          chain: CHAIN_MAP[chainId],
          account: userAddress,
          address: CONTRACT_ADDRESSES[chainId]!.Controller,
          abi: CONTROLLER_ABI,
          functionName: 'make',
          args: [
            [makeParam],
            tokensToSettle,
            options?.erc20PermitParam ? [options.erc20PermitParam] : [],
            getDeadlineTimestampInSeconds(),
          ],
          value: isETH ? quoteAmount : 0n,
        },
        options?.gasLimit,
      ),
      result: {
        make: {
          amount: formatUnits(quoteAmount, inputCurrency.decimals),
          currency: inputCurrency,
          direction: 'in',
          price: formatPrice(
            isBid
              ? toPrice(BigInt(makeParam.tick))
              : toPrice(invertTick(BigInt(makeParam.tick))),
            market.quote.decimals,
            market.base.decimals,
          ),
        },
        spent: {
          amount: '0',
          currency: inputCurrency,
          direction: 'in',
          events: [],
        },
        taken: {
          amount: '0',
          currency: outputCurrency,
          direction: 'out',
          events: [],
        },
      },
    }
  } else {
    // take and make
    return {
      transaction: await buildTransaction(
        publicClient,
        {
          chain: CHAIN_MAP[chainId],
          account: userAddress,
          address: CONTRACT_ADDRESSES[chainId]!.Controller,
          abi: CONTROLLER_ABI,
          functionName: 'limit',
          args: [
            [
              {
                takeBookId: bookId,
                makeBookId: makeParam.id,
                limitPrice: options?.takeLimitTick
                  ? toPrice(options.takeLimitTick)
                  : toPrice(
                      isBid
                        ? invertTick(
                            roundingUpTakenAsk
                              ? roundingUpTick
                              : roundingDownTick,
                          )
                        : roundingDownTakenBid
                          ? roundingDownTick
                          : roundingUpTick,
                    ),
                tick: makeParam.tick,
                quoteAmount,
                takeHookData: zeroHash,
                makeHookData: makeParam.hookData,
              },
            ],
            tokensToSettle,
            options?.erc20PermitParam ? [options.erc20PermitParam] : [],
            getDeadlineTimestampInSeconds(),
          ],
          value: isETH ? quoteAmount : 0n,
        },
        options?.gasLimit,
      ),
      result: {
        make: {
          amount: formatUnits(
            quoteAmount - parseUnits(spentAmount, inputCurrency.decimals),
            inputCurrency.decimals,
          ),
          currency: inputCurrency,
          direction: 'in',
          price: formatPrice(
            isBid
              ? toPrice(BigInt(makeParam.tick))
              : toPrice(invertTick(BigInt(makeParam.tick))),
            market.quote.decimals,
            market.base.decimals,
          ),
        },
        spent: {
          amount: spentAmount,
          currency: inputCurrency,
          direction: 'in',
          events: events.map(({ price, spentAmount }) => ({
            price,
            amount: spentAmount,
          })),
        },
        taken: {
          amount: takenAmount,
          currency: outputCurrency,
          direction: 'out',
          events: events.map(({ price, takenAmount }) => ({
            price,
            amount: takenAmount,
          })),
        },
      },
    }
  }
}
