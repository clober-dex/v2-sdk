import { createPublicClient, http, isAddressEqual } from 'viem'

import { CHAIN_MAP, CHAIN_IDS } from '../../src/constants/chain'
import { getMarketId } from '../../src/utils/market'
import { formatPrice } from '../../src/utils/prices'
import { invertPrice, toPrice } from '../../src/utils/tick'
import { fetchCurrency } from '../../src/apis/currency'

const MAX_TICK = 2n ** 19n - 1n
const BOOK_VIEWER_CONTRACT_ADDRESS =
  '0x8676558Af8D8a4A7fd7fC6A7b435D231393a2A76'
const _abi = [
  {
    inputs: [
      {
        internalType: 'BookId',
        name: 'id',
        type: 'uint192',
      },
      {
        internalType: 'Tick',
        name: 'tick',
        type: 'int24',
      },
      {
        internalType: 'uint256',
        name: 'n',
        type: 'uint256',
      },
    ],
    name: 'getLiquidity',
    outputs: [
      {
        components: [
          {
            internalType: 'Tick',
            name: 'tick',
            type: 'int24',
          },
          {
            internalType: 'uint64',
            name: 'depth',
            type: 'uint64',
          },
        ],
        internalType: 'struct IBookViewer.Liquidity[]',
        name: 'liquidity',
        type: 'tuple[]',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const

export const fetchDepth = async (
  chainId: CHAIN_IDS,
  inputToken: `0x${string}`,
  outputToken: `0x${string}`,
  bookId: bigint,
): Promise<
  {
    price: number
    amount: bigint
  }[]
> => {
  const { quoteTokenAddress, baseTokenAddress } = getMarketId(chainId, [
    outputToken,
    inputToken,
  ])
  const isBid = isAddressEqual(inputToken, quoteTokenAddress)
  const [quoteCurrency, baseCurrency] = await Promise.all([
    fetchCurrency(chainId, quoteTokenAddress),
    fetchCurrency(chainId, baseTokenAddress),
  ])
  const publicClient = createPublicClient({
    chain: CHAIN_MAP[chainId],
    transport: http(),
  })
  const depths = await publicClient.readContract({
    address: BOOK_VIEWER_CONTRACT_ADDRESS,
    abi: _abi,
    functionName: 'getLiquidity',
    args: [bookId, Number(MAX_TICK), 10n],
  })
  return depths.map(({ tick, depth }: { tick: number; depth: bigint }) => ({
    price: isBid
      ? formatPrice(
          toPrice(BigInt(tick)),
          quoteCurrency.decimals,
          baseCurrency.decimals,
        )
      : formatPrice(
          invertPrice(toPrice(BigInt(tick))),
          quoteCurrency.decimals,
          baseCurrency.decimals,
        ),
    amount: depth,
  }))
}
