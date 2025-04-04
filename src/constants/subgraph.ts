import axios from 'axios'

import { CHAIN_IDS } from './chain'

export const SUBGRAPH_URL: {
  [chain in CHAIN_IDS]: string
} = {
  [CHAIN_IDS.CLOBER_TESTNET]:
    'https://subgraph.satsuma-prod.com/f6a8c4889b7b/clober/v2-core-subgraph-arbitrum-sepolia/api',
  [CHAIN_IDS.CLOBER_TESTNET_2]:
    'https://subgraph.satsuma-prod.com/f6a8c4889b7b/clober/v2-core-subgraph-arbitrum-sepolia/api',
  [CHAIN_IDS.ARBITRUM_SEPOLIA]:
    'https://subgraph.satsuma-prod.com/f6a8c4889b7b/clober/v2-core-subgraph-arbitrum-sepolia/api',
  [CHAIN_IDS.BASE]:
    'https://subgraph.satsuma-prod.com/f6a8c4889b7b/clober/v2-core-subgraph-base/api',
  [CHAIN_IDS.BERACHAIN_MAINNET]:
    'https://subgraph.satsuma-prod.com/f6a8c4889b7b/clober/v2-core-subgraph-berachain-mainnet/api',
  [CHAIN_IDS.BERACHAIN_TESTNET]:
    'https://api.goldsky.com/api/public/project_clsljw95chutg01w45cio46j0/subgraphs/v2-core-subgraph-berachain-bartio/v1.8.1/gn',
  [CHAIN_IDS.RISE_SEPOLIA]:
    'https://api.goldsky.com/api/public/project_clsljw95chutg01w45cio46j0/subgraphs/v2-core-subgraph-rise-sepolia/v1.0.0/gn',
  [CHAIN_IDS.MITOSIS_TESTNET]:
    'https://api.goldsky.com/api/public/project_clsljw95chutg01w45cio46j0/subgraphs/v2-core-subgraph-mitosis-testnet/v1.8.1/gn',
  [CHAIN_IDS.MONAD_TESTNET]:
    'https://api.goldsky.com/api/public/project_clsljw95chutg01w45cio46j0/subgraphs/v2-core-subgraph-monad-testnet/v1.0.5/gn',
  [CHAIN_IDS.SONIC_MAINNET]:
    'https://subgraph.satsuma-prod.com/f6a8c4889b7b/clober/v2-core-subgraph-sonic-mainnet/api',
  [CHAIN_IDS.ZKSYNC_ERA]:
    'https://api.goldsky.com/api/public/project_clsljw95chutg01w45cio46j0/subgraphs/v2-core-subgraph-zksync-era/v1.5.5/gn',
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
        timeout: 2000, // TODO: pass with option
      },
    )

    if (response.status === 200) {
      return response.data
    } else {
      throw new Error((response.data as any).errors || 'Failed to fetch data')
    }
  }
}
