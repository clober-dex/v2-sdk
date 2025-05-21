import { getAddress } from 'viem'

import { CHAIN_IDS } from '../../../constants/chain-configs/chain'
import { Subgraph } from '../../../constants/chain-configs/subgraph'
import { getDailyStartTimestampInSeconds } from '../../../utils/time'
import { Currency } from '../types'

export const fetchCurrencies = async (
  chainId: CHAIN_IDS,
): Promise<Currency[]> => {
  const {
    data: { tokens },
  } = await Subgraph.get<{
    data: {
      tokens: {
        id: string
        name: string
        symbol: string
        decimals: string
      }[]
    }
  }>(
    chainId,
    'getCurrencies',
    'query getCurrencies { tokens { id name symbol decimals } }',
    {},
  )
  return tokens.map((token) => ({
    address: getAddress(token.id),
    name: token.name,
    symbol: token.symbol,
    decimals: Number(token.decimals),
  }))
}
export const fetchCurrentPriceMap = async (
  chainId: CHAIN_IDS,
): Promise<{
  [address: `0x${string}`]: number
}> => {
  const {
    data: { tokens },
  } = await Subgraph.get<{
    data: {
      tokens: {
        id: string
        priceUSD: string
      }[]
    }
  }>(
    chainId,
    'getCurrentTokenPrice',
    'query getCurrentTokenPrices { tokens(where: {priceUSD_gt: 0}) { id priceUSD } }',
    {},
  )

  return tokens.reduce(
    (acc, token) => {
      acc[getAddress(token.id)] = parseFloat(token.priceUSD)
      return acc
    },
    {} as {
      [address: `0x${string}`]: number
    },
  )
}

export const fetchDailyPriceMapAtTimestamp = async (
  chainId: CHAIN_IDS,
  timestampInSeconds: number,
): Promise<{
  [address: `0x${string}`]: number
}> => {
  const dayStartTimestamp = getDailyStartTimestampInSeconds(timestampInSeconds)

  const {
    data: { tokenDayData },
  } = await Subgraph.get<{
    data: {
      tokenDayData: {
        token: {
          id: string
        }
        priceUSD: string
      }[]
    }
  }>(
    chainId,
    'getDailyPriceMap',
    `query getDailyPriceMap($date: Int!) { tokenDayData(where: {date: $date, priceUSD_gt: 0}) { token { id } priceUSD } }`,
    {
      date: dayStartTimestamp,
    },
  )

  return tokenDayData.reduce(
    (acc, { token, priceUSD }) => {
      acc[getAddress(token.id)] = parseFloat(priceUSD)
      return acc
    },
    {} as {
      [address: `0x${string}`]: number
    },
  )
}
