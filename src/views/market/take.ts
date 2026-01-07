import { createPublicClient, formatUnits, http } from 'viem'

import { CHAIN_IDS, CHAIN_MAP } from '../../constants/chain-configs/chain'
import { DefaultReadContractOptions, Market, TakeEvent } from '../../types'
import { formatPrice, invertTick, quoteToBase, toPrice } from '../../utils'
import { getContractAddresses } from '../address'
import { BOOK_MANAGER_ABI } from '../../constants/abis/core/book-manager-abi'
import { fetchLatestTakes } from '../../entities/take/apis'

const handleTakeLog = (
  log: any,
  market: Market,
  onEvent: (args: TakeEvent) => void,
) => {
  const { args } = log

  const isTakingBidBook = BigInt(market.bidBook.id) === args.bookId
  const tick = BigInt(args.tick)
  const unit = BigInt(args.unit)
  const price = isTakingBidBook
    ? formatPrice(toPrice(tick), market.quote.decimals, market.base.decimals)
    : formatPrice(
        toPrice(invertTick(tick)),
        market.quote.decimals,
        market.base.decimals,
      )
  const amount = isTakingBidBook
    ? formatUnits(
        quoteToBase(tick, unit * BigInt(market.bidBook.unitSize), false),
        market.base.decimals,
      )
    : formatUnits(unit * BigInt(market.askBook.unitSize), market.base.decimals)

  onEvent({
    transactionHash: log.transactionHash,
    logIndex: Number(log.logIndex),
    timestamp: Number(log.blockTimestamp),
    blockNumber: Number(log.blockNumber),
    price: parseFloat(price),
    amount: parseFloat(amount),
    amountUSD: Number(parseFloat(price) * parseFloat(amount)),
    side: isTakingBidBook ? 'sell' : 'buy',
  })
}

const backfillTakeEventsFromSubgraph = async ({
  chainId,
  market,
  onEvent,
}: {
  chainId: CHAIN_IDS
  market: Market
  onEvent: Parameters<typeof handleTakeLog>[2]
}) => {
  const takes = await fetchLatestTakes(
    chainId,
    market.base.address,
    market.quote.address,
  )

  const logIndexMap = new Map<string, number>()
  for (const take of takes.reverse()) {
    if (logIndexMap.has(take.transactionHash)) {
      logIndexMap.set(
        take.transactionHash,
        (logIndexMap.get(take.transactionHash) ?? 0) + 1,
      )
    } else {
      logIndexMap.set(take.transactionHash, 0)
    }

    onEvent({
      ...take,
      logIndex: logIndexMap.get(take.transactionHash)!,
      blockNumber: 0, // Subgraph does not provide block number in this query
      side: take.side as 'buy' | 'sell',
    })
  }
}

export const watchTakeEvents = async ({
  chainId,
  market,
  onEvent,
  onError,
  options,
}: {
  chainId: CHAIN_IDS
  market: Market
  onEvent: Parameters<typeof handleTakeLog>[2]
  onError?: (error: Error) => void
  options?: DefaultReadContractOptions
}) => {
  const publicClient = createPublicClient({
    chain: CHAIN_MAP[chainId],
    transport: options?.rpcUrl ? http(options.rpcUrl) : http(),
  })

  const seen = new Set<string>()

  await backfillTakeEventsFromSubgraph({
    chainId,
    market,
    onEvent,
  })

  return publicClient.watchContractEvent({
    address: getContractAddresses({ chainId }).BookManager,
    abi: BOOK_MANAGER_ABI,
    eventName: 'Take',
    args: {
      bookId: [BigInt(market.bidBook.id), BigInt(market.askBook.id)],
    },
    onLogs: (logs) => {
      for (const log of logs) {
        const key = `${log.transactionHash}-${log.logIndex}`
        if (seen.has(key)) {
          continue
        }
        seen.add(key)

        handleTakeLog(log, market, onEvent)
      }
    },

    onError,
  })
}
