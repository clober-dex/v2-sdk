import { PublicClient } from 'viem'

import { CHAIN_IDS } from '../../../constants/chain-configs/chain'
import { Currency } from '../../currency/types'
import { calculateUnitSize } from '../../../utils/unit-size'
import { CONTRACT_ADDRESSES } from '../../../constants/chain-configs/addresses'
import { BOOK_VIEWER_ABI } from '../../../constants/abis/core/book-viewer-abi'
import { Subgraph } from '../../../constants/chain-configs/subgraph'
import { toBookId } from '../utils/book-id'
import { BookModel } from '../model'

const MAX_DEPTH = 20n // if the depth is too large, it may cause revert errors in the contract call

export const fetchBook = async (
  publicClient: PublicClient,
  chainId: CHAIN_IDS,
  quoteCurrency: Currency,
  baseCurrency: Currency,
  useSubgraph: boolean,
): Promise<BookModel> => {
  const unitSize = calculateUnitSize(chainId, quoteCurrency)
  const bookId = toBookId(
    chainId,
    quoteCurrency.address,
    baseCurrency.address,
    unitSize,
  )
  if (useSubgraph) {
    const {
      data: { book },
    } = await Subgraph.get<{
      data: {
        book: {
          depths: {
            tick: string
            price: string
            unitAmount: string
          }[]
        } | null
      }
    }>(
      chainId,
      'getBook',
      'query getBook($bookId: ID!, $first: Int!) { book(id: $bookId) { depths(first: $first where: {unitAmount_gt: 0}, orderBy: tick, orderDirection: desc) { tick unitAmount } } }',
      {
        bookId: bookId.toString(),
        first: 1000, // Adjust as needed for depth
      },
    )
    return new BookModel({
      chainId,
      id: bookId,
      base: baseCurrency,
      quote: quoteCurrency,
      unitSize,
      depths: book
        ? book.depths.map(
            ({ tick, unitAmount }: { tick: string; unitAmount: string }) => ({
              tick: BigInt(tick),
              unitAmount: BigInt(unitAmount),
            }),
          )
        : [],
      isOpened: book !== null,
    })
  }
  const [{ result: depths, error }, { result: isOpened }] =
    await publicClient.multicall({
      contracts: [
        {
          address: CONTRACT_ADDRESSES[chainId]!.BookViewer,
          abi: BOOK_VIEWER_ABI,
          functionName: 'getLiquidity',
          args: [bookId, Number(2n ** 19n - 1n), MAX_DEPTH],
        },
        {
          address: CONTRACT_ADDRESSES[chainId]!.BookManager,
          abi: [
            {
              inputs: [
                {
                  internalType: 'BookId',
                  name: 'id',
                  type: 'uint192',
                },
              ],
              name: 'isOpened',
              outputs: [
                {
                  internalType: 'bool',
                  name: '',
                  type: 'bool',
                },
              ],
              stateMutability: 'view',
              type: 'function',
            },
          ] as const,
          functionName: 'isOpened',
          args: [bookId],
        },
      ],
    })

  if (error) {
    throw new Error(`Failed to fetch book data: ${error.message}`)
  }

  return new BookModel({
    chainId,
    id: bookId,
    base: baseCurrency,
    quote: quoteCurrency,
    unitSize,
    depths: (depths ?? []).map(
      ({ tick, depth }: { tick: number; depth: bigint }) => ({
        tick: BigInt(tick),
        unitAmount: depth,
      }),
    ),
    isOpened: isOpened ?? false,
  })
}
