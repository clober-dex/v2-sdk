import BigNumber from 'bignumber.js'
import { PublicClient } from 'viem'

import { CONTRACT_ADDRESSES } from '../../src/constants/chain-configs/addresses'
import { BOOK_VIEWER_ABI } from '../../src/constants/abis/core/book-viewer-abi'

// @TODO: remove this function
export const getSize = (depth: any[], from: number, to: number) => {
  return new BigNumber(
    (
      depth.find(
        ({ price }) => from <= Number(price) && Number(price) <= to,
      ) ?? {
        baseAmount: 0n,
      }
    ).baseAmount.toString(),
  )
}

export const getDepth = ({
  publicClient,
  bookId,
}: {
  publicClient: PublicClient
  bookId: bigint
}) => {
  return publicClient.readContract({
    address: CONTRACT_ADDRESSES[publicClient.chain!.id]!.BookViewer,
    abi: BOOK_VIEWER_ABI,
    functionName: 'getLiquidity',
    args: [bookId, 524287, 100n],
  })
}
