import { getAddress } from 'viem'

import { CHAIN_IDS } from '../../../constants/chain-configs/chain'
import { Subgraph } from '../../../constants/chain-configs/subgraph'
import { getDailyStartTimestampInSeconds } from '../../../utils/time'

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
    data: { tokenDayDatas },
  } = await Subgraph.get<{
    data: {
      tokenDayDatas: {
        token: {
          id: string
        }
        priceUSD: string
      }[]
    }
  }>(
    chainId,
    'getDailyPriceMap',
    `query getDailyPriceMap($date: Int!) { tokenDayDatas(where: {date: $date, priceUSD_gt: 0}) { token { id } priceUSD } }`,
    {
      date: dayStartTimestamp,
    },
  )

  return tokenDayDatas.reduce(
    (acc, { token, priceUSD }) => {
      acc[getAddress(token.id)] = parseFloat(priceUSD)
      return acc
    },
    {} as {
      [address: `0x${string}`]: number
    },
  )
}
