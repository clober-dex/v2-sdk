import { parseEventLogs, TransactionReceipt } from 'viem'

import { BOOK_MANAGER_ABI } from '../../constants/abis/core/book-manager-abi'
import { toOrderId } from '../../entities/open-order/utils/order-id'
import { Market } from '../../entities/market/types'

export const parseMakeOrderIdsFromReceipt = ({
  market,
  transactionReceipt,
}: {
  market: Market
  transactionReceipt: TransactionReceipt
}): {
  bidOrderIds: string[]
  askOrderIds: string[]
} => {
  const logs = parseEventLogs({
    abi: BOOK_MANAGER_ABI,
    eventName: 'Make',
    logs: transactionReceipt.logs,
  }).filter((log) => log.eventName === 'Make')
  return {
    bidOrderIds: logs
      .filter(({ args: { bookId } }) => bookId === BigInt(market.bidBook.id))
      .map(({ args: { orderIndex, bookId, tick } }) =>
        toOrderId(bookId, BigInt(tick), orderIndex).toString(10),
      ),
    askOrderIds: logs
      .filter(({ args: { bookId } }) => bookId === BigInt(market.askBook.id))
      .map(({ args: { orderIndex, bookId, tick } }) =>
        toOrderId(bookId, BigInt(tick), orderIndex).toString(10),
      ),
  }
}
