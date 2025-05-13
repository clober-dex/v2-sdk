import { CHAIN_IDS } from '../constants/chain'
import { Subgraph, SUBGRAPH_URL } from '../constants/subgraph'

/**
 * Get subgraph endpoint by chain id
 * @param chainId - chain id from {@link CHAIN_IDS}
 * @returns Subgraph endpoint
 *
 * @example
 * import { getSubgraphEndpoint } from '@clober/v2-sdk'
 *
 * const endpoint = await getSubgraphEndpoint({
 *   chainId: 421614,
 * })
 */
export const getSubgraphEndpoint = ({ chainId }: { chainId: CHAIN_IDS }) => {
  return SUBGRAPH_URL[chainId]
}

/**
 * Get subgraph block number by chain id
 * @param chainId - chain id from {@link CHAIN_IDS}
 * @returns Contract addresses
 *
 * @example
 * import { getContractAddresses } from '@clober/v2-sdk'
 *
 * const blockNumber = await getSubgraphBlockNumber({
 *   chainId: 421614,
 * })
 */
export const getSubgraphBlockNumber = async ({
  chainId,
}: {
  chainId: CHAIN_IDS
}) => {
  const {
    data: {
      _meta: {
        block: { number: blockNumber },
      },
    },
  } = await Subgraph.get<{
    data: {
      _meta: {
        block: { number: string }
      }
    }
  }>(
    chainId,
    'getLatestBlockNumber',
    'query getLatestBlockNumber { _meta { block { number } } }',
    {},
  )
  return Number(blockNumber)
}
