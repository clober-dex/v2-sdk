import { formatUnits, getAddress, isAddressEqual } from 'viem'

import { Take } from '../types'
import { Subgraph } from '../../../constants/chain-configs/subgraph'
import { CHAIN_IDS } from '../../../constants/chain-configs/chain'
import { getMarketId } from '../../market/utils/market-id'

type TakeDto = {
  id: string
  timestamp: string
  inputToken: {
    id: `0x${string}`
    name: string
    symbol: string
    decimals: number
  }
  outputToken: {
    id: `0x${string}`
    name: string
    symbol: string
    decimals: number
  }
  inputAmount: string
  outputAmount: string
  amountUSD: string
  origin: string
}

export const fetchLatestTakes = async (
  chainId: CHAIN_IDS,
  tokenA: `0x${string}`,
  tokenB: `0x${string}`,
): Promise<Take[]> => {
  const {
    data: { swaps },
  } = await Subgraph.get<{
    data: {
      swaps: TakeDto[]
    }
  }>(
    chainId,
    'getLatestTrades',
    'query TakesByTokenPair($tokenA: String!, $tokenB: String!) { takes( orderBy: timestamp orderDirection: desc where: {or: [{inputToken: $tokenA, outputToken: $tokenB}, {inputToken: $tokenB, outputToken: $tokenA}]} ) { id timestamp amountUSD inputAmount outputAmount inputToken { id decimals } outputToken { id decimals } origin } }',
    {
      tokenA: tokenA.toLowerCase(),
      tokenB: tokenB.toLowerCase(),
    },
  )
  const { quoteTokenAddress } = getMarketId(chainId, [tokenA, tokenB])

  return swaps.map((swap) => {
    const side = isAddressEqual(swap.inputToken.id, quoteTokenAddress)
      ? 'buy'
      : 'sell'
    return {
      transactionHash: swap.id as `0x${string}`,
      timestamp: parseInt(swap.timestamp),
      side,
      currencyIn: {
        currency: {
          address: getAddress(swap.inputToken.id),
          name: swap.inputToken.name,
          symbol: swap.inputToken.symbol,
          decimals: Number(swap.inputToken.decimals),
        },
        amount: formatUnits(
          BigInt(swap.inputAmount),
          Number(swap.inputToken.decimals),
        ),
        direction: 'in',
      },
      currencyOut: {
        currency: {
          address: getAddress(swap.outputToken.id),
          name: swap.outputToken.name,
          symbol: swap.outputToken.symbol,
          decimals: Number(swap.outputToken.decimals),
        },
        amount: formatUnits(
          BigInt(swap.outputAmount),
          Number(swap.outputToken.decimals),
        ),
        direction: 'out',
      },
      amountUSD: Number(swap.amountUSD),
      user: getAddress(swap.origin),
    }
  })
}
