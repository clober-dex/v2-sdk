import { createPublicClient, formatUnits, http, parseAbiItem } from 'viem'
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

const handleRebalanceLog = (
  log: any,
  poolSnapshot: PoolSnapshot,
  onEvent: (args: {
    transactionHash: `0x${string}`
    timestamp: number
    blockNumber: number
    bidOrderList: { price: string; size: string }[]
    askOrderList: { price: string; size: string }[]
    quoteReserve: string
    baseReserve: string
  }) => void,
) => {
  const { args } = log

  onEvent({
    transactionHash: log.transactionHash,
    timestamp: Number(log.blockTimestamp),
    blockNumber: Number(log.blockNumber),

    bidOrderList: args.orderListA.map((orderId: bigint) => {
      const tick = fromOrderId(orderId).tick
      const price = formatPrice(
        toPrice(tick),
        poolSnapshot.currencyA.decimals,
        poolSnapshot.currencyB.decimals,
      )
      const amount = formatUnits(args.amountA, poolSnapshot.currencyA.decimals)

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

    quoteReserve: formatUnits(args.reserveA, poolSnapshot.currencyA.decimals),
    baseReserve: formatUnits(args.reserveB, poolSnapshot.currencyB.decimals),
  })
}

const backfillRebalanceEvents = async ({
  publicClient,
  chainId,
  poolSnapshot,
  backfillBlocks,
  onEvent,
}: {
  publicClient: ReturnType<typeof createPublicClient>
  chainId: CHAIN_IDS
  poolSnapshot: PoolSnapshot
  backfillBlocks: bigint
  onEvent: Parameters<typeof handleRebalanceLog>[2]
}) => {
  const currentBlock = await publicClient.getBlockNumber()

  const fromBlock =
    currentBlock > backfillBlocks ? currentBlock - backfillBlocks : 0n

  const logs = await publicClient.getLogs({
    address: getContractAddresses({ chainId }).Rebalancer,
    event: parseAbiItem(
      'event Rebalance(bytes32 indexed key,address indexed caller,uint256[] orderListA,uint256[] orderListB,uint256 amountA,uint256 amountB,uint256 reserveA,uint256 reserveB)',
    ),
    args: {
      key: poolSnapshot.key,
    },
    fromBlock,
    toBlock: currentBlock,
  })

  for (const log of logs) {
    handleRebalanceLog(log, poolSnapshot, onEvent)
  }

  return currentBlock
}

export const watchMarketMakingEvents = async ({
  chainId,
  poolSnapshot,
  options,
  onEvent,
  onError,
}: {
  chainId: CHAIN_IDS
  poolSnapshot: PoolSnapshot
  onEvent: Parameters<typeof handleRebalanceLog>[2]
  onError?: (error: Error) => void
  options?: {
    backfillBlocks?: bigint
  } & DefaultReadContractOptions
}) => {
  const publicClient = createPublicClient({
    chain: CHAIN_MAP[chainId],
    transport: options?.rpcUrl ? http(options.rpcUrl) : http(),
  })

  const seen = new Set<string>()

  const lastBackfilledBlock = await backfillRebalanceEvents({
    publicClient,
    chainId,
    poolSnapshot,
    backfillBlocks: options?.backfillBlocks ?? 100n,
    onEvent,
  })

  return publicClient.watchContractEvent({
    address: getContractAddresses({ chainId }).Rebalancer,
    abi: REBALANCER_ABI,
    eventName: 'Rebalance',
    args: {
      key: poolSnapshot.key,
    },
    fromBlock: lastBackfilledBlock + 1n,

    onLogs: (logs) => {
      for (const log of logs) {
        const key = `${log.blockNumber}-${log.logIndex}`
        if (seen.has(key)) {
          continue
        }
        seen.add(key)

        handleRebalanceLog(log, poolSnapshot, onEvent)
      }
    },

    onError,
  })
}
