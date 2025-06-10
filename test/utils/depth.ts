import { PublicClient } from 'viem'

import { CONTRACT_ADDRESSES } from '../../src/constants/chain-configs/addresses'
import { BOOK_VIEWER_ABI } from '../../src/constants/abis/core/book-viewer-abi'

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
