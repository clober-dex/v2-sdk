import { formatUnits, getAddress, PublicClient } from 'viem'

import { Swap } from '../types'
import { Subgraph } from '../../../constants/chain-configs/subgraph'
import { CHAIN_IDS } from '../../../constants/chain-configs/chain'
import { fetchCurrencyMap } from '../../currency/apis'

type SwapDto = {
  transaction: {
    id: string
    gasUsed: string
    gasPrice: string
    value: string
    to: string
    from: string
  }
  timestamp: string
  inputToken: string
  outputToken: string
  inputAmount: string
  outputAmount: string
  amountUSD: string
  router: string
}

export const fetchLatestTrades = async (
  publicClient: PublicClient,
  chainId: CHAIN_IDS,
  n: number,
  useSubgraph: boolean,
): Promise<Swap[]> => {
  const {
    data: { swaps },
  } = await Subgraph.get<{
    data: {
      swaps: SwapDto[]
    }
  }>(
    chainId,
    'getLatestTrades',
    'query getLatestTrades($first: Int!) { swaps(first: $first, orderBy: timestamp, orderDirection: desc) { transaction { id gasUsed gasPrice value to from } timestamp inputToken outputToken inputAmount outputAmount amountUSD router } }',
    {
      first: n,
    },
  )
  const uniqueTokens = [
    ...new Set(swaps.flatMap((swap) => [swap.inputToken, swap.outputToken])),
  ].map((address) => getAddress(address))
  const currencyMap = await fetchCurrencyMap(
    publicClient,
    chainId,
    uniqueTokens,
    useSubgraph,
  )

  return swaps
    .map((swap) => {
      return currencyMap[getAddress(swap.inputToken)] &&
        currencyMap[getAddress(swap.outputToken)]
        ? {
            transaction: {
              data: '' as `0x${string}`,
              id: swap.transaction.id as `0x${string}`,
              gas: BigInt(swap.transaction.gasUsed),
              gasPrice: BigInt(swap.transaction.gasPrice),
              value: BigInt(swap.transaction.value),
              to: getAddress(swap.transaction.to),
              from: getAddress(swap.transaction.from),
            },
            timestamp: Number(swap.timestamp),
            currencyIn: {
              currency: currencyMap[getAddress(swap.inputToken)],
              amount: formatUnits(
                BigInt(swap.inputAmount),
                currencyMap[getAddress(swap.inputToken)].decimals,
              ),
              direction: 'in',
            },
            currencyOut: {
              currency: currencyMap[getAddress(swap.outputToken)],
              amount: formatUnits(
                BigInt(swap.outputAmount),
                currencyMap[getAddress(swap.outputToken)].decimals,
              ),
              direction: 'out',
            },
            amountUSD: Number(swap.amountUSD),
            router: getAddress(swap.router),
          }
        : null
    })
    .filter((swap): swap is any => swap !== null) as Swap[]
}
