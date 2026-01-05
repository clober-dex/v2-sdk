import { CHAIN_IDS } from '../../constants/chain-configs/chain'
import { Take } from '../../types'
import { fetchLatestTakes } from '../../entities/take/apis'

export const getLatestTakes = async ({
  chainId,
  token0,
  token1,
}: {
  chainId: CHAIN_IDS
  token0: `0x${string}`
  token1: `0x${string}`
}): Promise<Take[]> => {
  return fetchLatestTakes(chainId, token0, token1)
}
