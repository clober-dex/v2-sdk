import { CHAIN_IDS } from '../../constants/chain-configs/chain'
import { fetchUserPoolPositionsFromSubgraph } from '../../entities/pool/apis/snapshot'
import { UserPoolPosition } from '../../entities/pool/types'

export const getUserPoolPositions = async ({
  chainId,
  userAddress,
  prices,
}: {
  chainId: CHAIN_IDS
  userAddress: `0x${string}`
  prices: Record<`0x${string}`, number>
}): Promise<UserPoolPosition[]> => {
  return fetchUserPoolPositionsFromSubgraph(
    chainId,
    userAddress,
    Object.entries(prices).reduce(
      (acc, [key, value]) => {
        acc[key.toLowerCase() as `0x${string}`] = value
        return acc
      },
      {} as Record<`0x${string}`, number>,
    ),
  )
}
