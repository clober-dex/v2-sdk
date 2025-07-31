import {
  createPublicClient,
  encodeAbiParameters,
  getAddress,
  http,
  isAddress,
  isAddressEqual,
  parseUnits,
  zeroAddress,
  zeroHash,
} from 'viem'

import { CHAIN_IDS, CHAIN_MAP } from '../../constants/chain-configs/chain'
import { DefaultWriteContractOptions } from '../../types'
import { fetchMarket } from '../../entities/market/apis'
import { Market, Transaction } from '../../../dist/types'
import {
  getContractAddresses,
  getOpenOrders,
  getPriceNeighborhood,
} from '../../views'
import { CONTROLLER_ABI } from '../../constants/abis/core/controller-abi'
import {
  CANCEL_ORDER_PARAMS_ABI,
  CLAIM_ORDER_PARAMS_ABI,
  MAKE_ORDER_PARAMS_ABI,
} from '../../constants/abis/core/params-abi'
import { buildTransaction } from '../../utils/build-transaction'

export enum Action {
  OPEN,
  MAKE,
  LIMIT,
  TAKE,
  SPEND,
  CLAIM,
  CANCEL,
}

export const placeMarketMakingQuotes = async ({
  chainId,
  userAddress,
  quotes,
  token0,
  token1,
  clearOpenOrders,
  options,
}: {
  chainId: CHAIN_IDS
  userAddress: `0x${string}`
  quotes: {
    bid: { price: string; amount: string }[]
    ask: { price: string; amount: string }[]
  }
  token0: `0x${string}`
  token1: `0x${string}`
  clearOpenOrders?: boolean
  options?: {
    market?: Market
    roundingUpMakeBid?: boolean
    roundingDownMakeAsk?: boolean
    useSubgraph?: boolean
    provider?: `0x${string}`
    orderIdsToClaim: string[]
    orderIdsToCancel: string[]
  } & DefaultWriteContractOptions
}): Promise<Transaction> => {
  let orderIdsToClaim = options?.orderIdsToClaim || []
  let orderIdsToCancel = options?.orderIdsToCancel || []
  if (clearOpenOrders) {
    const openOrders = await getOpenOrders({
      chainId,
      userAddress,
    })
    orderIdsToClaim = openOrders
      .filter(({ claimable }) => Number(claimable.value) > 0)
      .map((order) => order.id)
    orderIdsToCancel = openOrders
      .filter(({ cancelable }) => Number(cancelable.value) > 0)
      .map((order) => order.id)
  }

  const [roundingUpMakeBid, roundingDownMakeAsk] = [
    options?.roundingUpMakeBid ? options.roundingUpMakeBid : false,
    options?.roundingDownMakeAsk ? options.roundingDownMakeAsk : false,
  ]
  const publicClient = createPublicClient({
    chain: CHAIN_MAP[chainId],
    transport: options?.rpcUrl ? http(options.rpcUrl) : http(),
  })
  const market = options?.market
    ? options.market
    : (
        await fetchMarket(
          publicClient,
          chainId,
          [token0, token1],
          !!(options && options.useSubgraph),
        )
      ).toJson()

  if (!market.bidBook.isOpened) {
    throw new Error(`
       Open the market before placing a limit order.
       import { openMarket } from '@clober/v2-sdk'

       const transaction = await openMarket({
            chainId: ${chainId},
            inputToken: '${market.quote.address}',
            outputToken: '${market.base.address}',  
       })
    `)
  }

  if (!market.askBook.isOpened) {
    throw new Error(`
       Open the market before placing a limit order.
       import { openMarket } from '@clober/v2-sdk'

       const transaction = await openMarket({
            chainId: ${chainId},
            inputToken: '${market.base.address}',
            outputToken: '${market.quote.address}',  
       })
    `)
  }

  const provider =
    options && options.provider && isAddress(options.provider)
      ? getAddress(options.provider)
      : zeroAddress

  const bidMakeParams = quotes.bid.map((quote) => {
    const {
      normal: {
        now: { tick: bidTick },
      },
    } = getPriceNeighborhood({
      chainId,
      price: quote.price,
      currency0: market.quote,
      currency1: market.base,
    })
    return {
      id: BigInt(market.bidBook.id),
      tick: roundingUpMakeBid ? Number(bidTick + 1n) : Number(bidTick),
      quoteAmount: parseUnits(quote.amount, market.quote.decimals),
      provider,
      hookData: zeroHash,
      isNative: isAddressEqual(market.quote.address, zeroAddress),
    }
  })
  const askMakeParams = quotes.ask.map((quote) => {
    const {
      inverted: {
        now: { tick: askTick },
      },
    } = getPriceNeighborhood({
      chainId,
      price: quote.price,
      currency0: market.quote,
      currency1: market.base,
    })
    return {
      id: BigInt(market.askBook.id),
      tick: roundingDownMakeAsk ? Number(askTick - 1n) : Number(askTick),
      quoteAmount: parseUnits(quote.amount, market.base.decimals),
      provider,
      hookData: zeroHash,
      isNative: isAddressEqual(market.base.address, zeroAddress),
    }
  })

  const args = {
    address: getContractAddresses({ chainId })!.Controller,
    abi: CONTROLLER_ABI,
    account: userAddress,
    functionName: 'execute',
    args: [
      [
        ...orderIdsToClaim.map(() => Action.CLAIM),
        ...orderIdsToCancel.map(() => Action.CANCEL),
        ...[...bidMakeParams].map(() => Action.MAKE),
        ...[...askMakeParams].map(() => Action.MAKE),
      ],
      [
        ...orderIdsToClaim.map((id) =>
          encodeAbiParameters(CLAIM_ORDER_PARAMS_ABI, [
            { id, hookData: zeroHash },
          ]),
        ),
        ...orderIdsToCancel.map((id) =>
          encodeAbiParameters(CANCEL_ORDER_PARAMS_ABI, [
            { id, leftQuoteAmount: 0n, hookData: zeroHash },
          ]),
        ),
        ...[...bidMakeParams].map((param) =>
          encodeAbiParameters(MAKE_ORDER_PARAMS_ABI, [
            {
              id: param.id,
              tick: param.tick,
              quoteAmount: param.quoteAmount,
              provider: param.provider,
              hookData: param.hookData,
            },
          ]),
        ),
        ...[...askMakeParams].map((param) =>
          encodeAbiParameters(MAKE_ORDER_PARAMS_ABI, [
            {
              id: param.id,
              tick: param.tick,
              quoteAmount: param.quoteAmount,
              provider: param.provider,
              hookData: param.hookData,
            },
          ]),
        ),
      ],
      [market.base.address, market.quote.address].filter(
        (address) => !isAddressEqual(address, zeroAddress),
      ),
      [],
      [],
      2n ** 64n - 1n,
    ],
    value: [...bidMakeParams, ...askMakeParams]
      .filter((p) => p.isNative)
      .reduce((acc, p) => acc + BigInt(p.quoteAmount), 0n),
  } as any

  return buildTransaction(publicClient, args, options?.gasLimit)
}
