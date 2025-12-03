import axios from 'axios'

import { CHAIN_IDS } from './chain'

export const SUBGRAPH_URL: {
  [chain in CHAIN_IDS]: string
} = {
  [CHAIN_IDS.CLOBER_TESTNET]:
    'https://subgraph.satsuma-prod.com/f6a8c4889b7b/clober/v2-subgraph-arbitrum-sepolia/api',
  [CHAIN_IDS.ARBITRUM_SEPOLIA]:
    'https://subgraph.satsuma-prod.com/f6a8c4889b7b/clober/v2-subgraph-arbitrum-sepolia/api',
  // [CHAIN_IDS.BASE]:
  //   'https://subgraph.satsuma-prod.com/f6a8c4889b7b/clober/v2-core-subgraph-base/api',
  [CHAIN_IDS.BERACHAIN_MAINNET]:
    'https://subgraph.satsuma-prod.com/f6a8c4889b7b/clober/v2-subgraph-berachain-mainnet/api',
  [CHAIN_IDS.RISE_SEPOLIA]:
    'https://api.goldsky.com/api/public/project_clsljw95chutg01w45cio46j0/subgraphs/v2-subgraph-rise-sepolia/latest/gn',
  [CHAIN_IDS.GIWA_SEPOLIA]:
    'https://subgraph.giwadex.io/subgraphs/name/v2-subgraph-giwa-sepolia',
  [CHAIN_IDS.MONAD_TESTNET]:
    'https://api.goldsky.com/api/public/project_clsljw95chutg01w45cio46j0/subgraphs/v2-subgraph-monad-testnet/latest/gn',
  [CHAIN_IDS.MONAD_MAINNET]:
    'https://api.subgraph.ormilabs.com/api/public/27ad58eb-e12c-4b7b-8df8-0560d8e26b37/subgraphs/v2-subgraph-monad/latest/gn',
  // [CHAIN_IDS.SONIC_MAINNET]:
  //   'https://subgraph.satsuma-prod.com/f6a8c4889b7b/clober/v2-core-subgraph-sonic-mainnet/api',
}

export const FALLBACK_SUBGRAPH_URL: {
  [chain in CHAIN_IDS]: string | undefined
} = {
  [CHAIN_IDS.MONAD_MAINNET]:
    'https://api.goldsky.com/api/public/project_clsljw95chutg01w45cio46j0/subgraphs/v2-subgraph-monad/latest/gn',
}

export class Subgraph {
  public static async get<T>(
    chainId: CHAIN_IDS,
    operationName: string,
    query: string,
    variables: {},
  ): Promise<T> {
    if (!SUBGRAPH_URL[chainId]) {
      throw new Error('Unsupported chain for subgraph')
    }
    const response = await axios.post(
      SUBGRAPH_URL[chainId],
      {
        query,
        variables,
        operationName,
      },
      {
        timeout: 5000, // TODO: pass with option
      },
    )

    if (response.status === 200) {
      return response.data
    } else {
      throw new Error((response.data as any).errors || 'Failed to fetch data')
    }
  }
}
