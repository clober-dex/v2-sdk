import { CHAIN_IDS } from '../constants/chain-configs/chain'
import {
  FALLBACK_SUBGRAPH_URL,
  Subgraph,
  SUBGRAPH_URL,
} from '../constants/chain-configs/subgraph'

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
 * Get fallback subgraph endpoint by chain id
 * @param chainId - chain id from {@link CHAIN_IDS}
 * @returns Subgraph endpoint
 *
 * @example
 * import { getFallbackSubgraphEndpoint } from '@clober/v2-sdk'
 *
 * const endpoint = await getFallbackSubgraphEndpoint({
 *   chainId: 421614,
 * })
 */
export const getFallbackSubgraphEndpoint = ({
  chainId,
}: {
  chainId: CHAIN_IDS
}) => {
  return FALLBACK_SUBGRAPH_URL[chainId]
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
        block: { number: number }
      }
    }
  }>(
    chainId,
    'getLatestBlockNumber',
    'query getLatestBlockNumber { _meta { block { number } } }',
    {},
  )
  return blockNumber
}

/**
 * Get subgraph block number by chain id
 * @param chainId - chain id from {@link CHAIN_IDS}
 * @returns Contract addresses
 *
 * @example
 * import { getContractAddresses } from '@clober/v2-sdk'
 *
 * const blockNumber = await getSubgraphBlock({
 *   chainId: 421614,
 * })
 */
export const getSubgraphBlock = async ({ chainId }: { chainId: CHAIN_IDS }) => {
  const {
    data: {
      _meta: {
        block: { number: blockNumber, hash, timestamp, parentHash },
      },
    },
  } = await Subgraph.get<{
    data: {
      _meta: {
        block: {
          number: number
          hash: string
          timestamp: number
          parentHash: string
        }
      }
    }
  }>(
    chainId,
    'getLatestBlock',
    'query getLatestBlock { _meta { block { number hash timestamp parentHash } } }',
    {},
  )
  return {
    blockNumber,
    hash,
    timestamp,
    parentHash,
  }
}
