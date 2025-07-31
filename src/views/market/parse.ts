import { parseEventLogs, TransactionReceipt } from 'viem'

import { Market } from '../../../dist/types'
import { BOOK_MANAGER_ABI } from '../../constants/abis/core/book-manager-abi'
import { toOrderId } from '../../entities/open-order/utils/order-id'

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
