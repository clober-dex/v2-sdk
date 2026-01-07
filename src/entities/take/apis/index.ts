import { formatUnits, getAddress, isAddressEqual } from 'viem'

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
) => {
  const {
    data: { takes },
  } = await Subgraph.get<{
    data: {
      takes: TakeDto[]
    }
  }>(
    chainId,
    'getLatestTakes',
    'query TakesByTokenPair($tokenA: String!, $tokenB: String!) { takes( orderBy: timestamp orderDirection: desc where: {or: [{inputToken: $tokenA, outputToken: $tokenB}, {inputToken: $tokenB, outputToken: $tokenA}]} ) { id timestamp amountUSD inputAmount outputAmount inputToken { id decimals } outputToken { id decimals } origin } }',
    {
      tokenA: tokenA.toLowerCase(),
      tokenB: tokenB.toLowerCase(),
    },
  )
  const { quoteTokenAddress } = getMarketId(chainId, [tokenA, tokenB])

  return takes.map((swap) => {
    const side = isAddressEqual(swap.inputToken.id, quoteTokenAddress)
      ? 'buy'
      : 'sell'
    const baseAmount = Number(
      formatUnits(
        BigInt(side === 'buy' ? swap.outputAmount : swap.inputAmount),
        side === 'buy'
          ? Number(swap.outputToken.decimals)
          : Number(swap.inputToken.decimals),
      ),
    )
    const quoteAmount = Number(
      formatUnits(
        BigInt(side === 'buy' ? swap.inputAmount : swap.outputAmount),
        side === 'buy'
          ? Number(swap.inputToken.decimals)
          : Number(swap.outputToken.decimals),
      ),
    )
    return {
      transactionHash: swap.id.split('-')[0] as `0x${string}`,
      timestamp: parseInt(swap.timestamp),
      side,
      price: quoteAmount / baseAmount,
      amount: baseAmount,
      amountUSD: Number(swap.amountUSD),
      user: getAddress(swap.origin),
    }
  })
}
