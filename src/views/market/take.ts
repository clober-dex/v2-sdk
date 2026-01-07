import { createPublicClient, formatUnits, http, parseAbiItem } from 'viem'

import { CHAIN_IDS, CHAIN_MAP } from '../../constants/chain-configs/chain'
import { DefaultReadContractOptions, Market, Take } from '../../types'
import { formatPrice, invertTick, quoteToBase, toPrice } from '../../utils'
import { getContractAddresses } from '../address'
import { BOOK_MANAGER_ABI } from '../../constants/abis/core/book-manager-abi'

const handleTakeLog = (
  log: any,
  market: Market,
  onEvent: (args: Take) => void,
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
    timestamp: Number(log.blockTimestamp),
    blockNumber: Number(log.blockNumber),
    price: parseFloat(price),
    amount: parseFloat(amount),
    amountUSD: Number(parseFloat(price) * parseFloat(amount)),
    side: isTakingBidBook ? 'sell' : 'buy',
  })
}

const backfillRebalanceEvents = async ({
  publicClient,
  chainId,
  market,
  backfillBlocks,
  onEvent,
}: {
  publicClient: ReturnType<typeof createPublicClient>
  chainId: CHAIN_IDS
  market: Market
  backfillBlocks: bigint
  onEvent: Parameters<typeof handleTakeLog>[2]
}) => {
  const currentBlock = await publicClient.getBlockNumber()

  const fromBlock =
    currentBlock > backfillBlocks ? currentBlock - backfillBlocks : 0n

  const logs = await publicClient.getLogs({
    address: getContractAddresses({ chainId }).BookManager,
    event: parseAbiItem(
      'event Take(uint192 indexed bookId, address indexed user, int24 tick, uint64 unit)',
    ),
    args: {
      bookId: [BigInt(market.bidBook.id), BigInt(market.askBook.id)],
    },
    fromBlock,
    toBlock: currentBlock,
  })

  for (const log of logs) {
    handleTakeLog(log, market, onEvent)
  }

  return currentBlock
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
    market,
    backfillBlocks: options?.backfillBlocks ?? 100n,
    onEvent,
  })

  return publicClient.watchContractEvent({
    address: getContractAddresses({ chainId }).BookManager,
    abi: BOOK_MANAGER_ABI,
    eventName: 'Take',
    args: {
      bookId: [BigInt(market.bidBook.id), BigInt(market.askBook.id)],
    },
    fromBlock: lastBackfilledBlock + 1n,
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
