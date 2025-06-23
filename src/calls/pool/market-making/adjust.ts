import { createPublicClient, http, parseUnits } from 'viem'

import { CHAIN_IDS, CHAIN_MAP } from '../../../constants/chain-configs/chain'
import { DefaultWriteContractOptions, Pool, Transaction } from '../../../types'
import { fetchPool } from '../../../entities/pool/apis'
import {
  convertHumanReadablePriceToRawPrice,
  parsePrice,
} from '../../../utils/prices'
import { invertTick } from '../../../utils'
import { buildTransaction } from '../../../utils/build-transaction'
import { CONTRACT_ADDRESSES } from '../../../constants/chain-configs/addresses'
import { OPERATOR_ABI } from '../../../constants/abis/rebalancer/operator-abi'

export const adjustOrderPrice = async ({
  chainId,
  userAddress,
  token0,
  token1,
  salt,
  oraclePrice,
  bidPrice,
  askPrice,
  alpha,
  options,
}: {
  chainId: CHAIN_IDS
  userAddress: `0x${string}`
  token0: `0x${string}`
  token1: `0x${string}`
  salt: `0x${string}`
  oraclePrice: string // price with currencyA as quote
  bidPrice: string // price with bookA. bid price
  askPrice: string // price with bookA. ask price
  alpha: string // alpha value, 0 < alpha <= 1
  options?: {
    bidTick?: bigint
    askTick?: bigint
    roundingUpBidPrice?: boolean
    roundingUpAskPrice?: boolean
    useSubgraph?: boolean
    pool?: Pool
  } & DefaultWriteContractOptions
}): Promise<Transaction> => {
  if (Number(alpha) <= 0 || Number(alpha) > 1) {
    throw new Error('Alpha value must be in the range (0, 1]')
  }
  if (Number(bidPrice) <= 0 || Number(askPrice) <= 0) {
    throw new Error('Price must be greater than 0')
  }
  if (Number(bidPrice) >= Number(askPrice)) {
    throw new Error('Bid price must be less than ask price')
  }
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
       Open the pool before updating strategy price.
       import { openPool } from '@clober/v2-sdk'

       const transaction = await openPool({
            chainId: ${chainId},
            token0: '${token0}',
            token1: '${token1}',
            salt: '0x0000000000000000000000000000000000000000000000000000000000000000',
       })
    `)
  }
  const [roundingUpBidPrice, roundingUpAskPrice] = [
    options?.roundingUpBidPrice ? options.roundingUpBidPrice : false,
    options?.roundingUpAskPrice ? options.roundingUpAskPrice : false,
  ]
  const {
    roundingDownTick: roundingDownTickA,
    roundingUpTick: roundingUpTickA,
  } = parsePrice(
    Number(bidPrice),
    pool.currencyA.decimals,
    pool.currencyB.decimals,
  )
  const {
    roundingDownTick: roundingDownTickB,
    roundingUpTick: roundingUpTickB,
  } = parsePrice(
    Number(askPrice),
    pool.currencyA.decimals,
    pool.currencyB.decimals,
  )

  const oracleRawPrice = convertHumanReadablePriceToRawPrice(
    Number(oraclePrice),
    pool.currencyA.decimals,
    pool.currencyB.decimals,
  )
  const tickA = options?.bidTick
    ? Number(options.bidTick)
    : Number(roundingUpBidPrice ? roundingUpTickA : roundingDownTickA)
  let tickB = options?.askTick
    ? Number(options.askTick)
    : Number(
        invertTick(roundingUpAskPrice ? roundingUpTickB : roundingDownTickB),
      )

  if (invertTick(BigInt(tickB)) <= BigInt(tickA)) {
    tickB = Number(invertTick(BigInt(tickA + 1)))
  }

  const rateRaw = parseUnits(alpha, 6)

  return buildTransaction(
    publicClient,
    {
      chain: CHAIN_MAP[chainId],
      account: userAddress,
      address: CONTRACT_ADDRESSES[chainId]!.Operator,
      abi: OPERATOR_ABI,
      functionName: 'updatePosition',
      args: [pool.key, oracleRawPrice, tickA, tickB, rateRaw],
    },
    options?.gasLimit,
    options?.gasPriceLimit,
  )
}
