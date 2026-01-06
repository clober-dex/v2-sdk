import { createPublicClient, formatUnits, http } from 'viem'
import BigNumber from 'bignumber.js'

import { CHAIN_IDS, CHAIN_MAP } from '../../constants/chain-configs/chain'
import {
  DefaultReadContractOptions,
  LastAmounts,
  PoolSnapshot,
  StrategyPosition,
} from '../../types'
import {
  fetchLastAmounts,
  fetchStrategyPosition,
} from '../../entities/pool/apis/strategy'
import { REBALANCER_ABI } from '../../constants/abis/rebalancer/rebalancer-abi'
import { getContractAddresses } from '../address'
import { fromOrderId } from '../../entities/open-order/utils/order-id'
import { formatPrice, invertTick, toPrice } from '../../utils'

export const getStrategyPrice = async ({
  chainId,
  poolKey,
  options,
}: {
  chainId: CHAIN_IDS
  poolKey: `0x${string}`
  options?: DefaultReadContractOptions
}): Promise<StrategyPosition> => {
  const publicClient = createPublicClient({
    chain: CHAIN_MAP[chainId],
    transport: options?.rpcUrl ? http(options.rpcUrl) : http(),
  })
  return fetchStrategyPosition(publicClient, chainId, poolKey)
}

export const getLastAmounts = async ({
  chainId,
  poolKey,
  options,
}: {
  chainId: CHAIN_IDS
  poolKey: `0x${string}`
  options?: DefaultReadContractOptions
}): Promise<LastAmounts> => {
  const publicClient = createPublicClient({
    chain: CHAIN_MAP[chainId],
    transport: options?.rpcUrl ? http(options.rpcUrl) : http(),
  })
  return fetchLastAmounts(publicClient, chainId, poolKey)
}

export const watchMarketMakingEvents = ({
  chainId,
  poolSnapshot,
  options,
  onEvent,
  onError,
}: {
  chainId: CHAIN_IDS
  poolSnapshot: PoolSnapshot
  onEvent: (args: {
    bidOrderList: { price: string; size: string }[]
    askOrderList: { price: string; size: string }[]
    quoteReserve: string
    baseReserve: string
  }) => void
  onError?: (error: Error) => void
  options?: DefaultReadContractOptions
}) => {
  const publicClient = createPublicClient({
    chain: CHAIN_MAP[chainId],
    transport: options?.rpcUrl ? http(options.rpcUrl) : http(),
  })

  return publicClient.watchContractEvent({
    address: getContractAddresses({ chainId }).Rebalancer,
    abi: REBALANCER_ABI,
    eventName: 'Rebalance',
    args: {
      key: poolSnapshot.key,
    },

    onLogs: (logs) => {
      for (const log of logs) {
        const { args } = log as any
        onEvent({
          bidOrderList: args.orderListA.map((orderId: bigint) => {
            const tick = fromOrderId(orderId).tick
            const price = formatPrice(
              toPrice(tick),
              poolSnapshot.currencyA.decimals,
              poolSnapshot.currencyB.decimals,
            )
            const amount = formatUnits(
              args.amountA,
              poolSnapshot.currencyA.decimals,
            )
            return {
              price,
              size: new BigNumber(amount)
                .dividedBy(new BigNumber(price))
                .toFixed(poolSnapshot.currencyB.decimals),
            }
          }),
          askOrderList: args.orderListB.map((orderId: bigint) => {
            const tick = fromOrderId(orderId).tick
            return {
              price: formatPrice(
                toPrice(invertTick(tick)),
                poolSnapshot.currencyA.decimals,
                poolSnapshot.currencyB.decimals,
              ),
              size: formatUnits(args.amountB, poolSnapshot.currencyB.decimals),
            }
          }),
          quoteReserve: formatUnits(
            args.reserveA,
            poolSnapshot.currencyA.decimals,
          ),
          baseReserve: formatUnits(
            args.reserveB,
            poolSnapshot.currencyB.decimals,
          ),
        })
      }
    },

    onError,
  })
}
