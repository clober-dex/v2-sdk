import { CHAIN_IDS } from './chain'

const SUBGRAPH_URL: {
  [chain in CHAIN_IDS]: string
} = {
  [CHAIN_IDS.ARBITRUM_SEPOLIA]:
    'https://subgraph.satsuma-prod.com/f6a8c4889b7b/clober/v2-core-subgraph/api',
}

class Subgraph {
  private subgraphURL: string
  constructor(chainId: CHAIN_IDS) {
    if (!SUBGRAPH_URL[chainId]) {
      throw new Error('Unsupported chain for subgraph')
    }
    this.subgraphURL = SUBGRAPH_URL[chainId]
  }

  public async get<T>(
    operationName: string,
    query: string,
    variables: {},
  ): Promise<T> {
    const response = await fetch(this.subgraphURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables,
        operationName,
      }),
    })

    if (response.ok) {
      return response.json() as Promise<T>
    } else {
      const errorResponse = await response.json()

      throw new Error((errorResponse as any).message || 'Unknown Error')
    }
  }
}

export const cachedSubgraph: Record<CHAIN_IDS, Subgraph | undefined> =
  {} as const
export const buildSubgraph = (
  chainId: CHAIN_IDS,
  useSubgraph: boolean = true,
) => {
  if (!useSubgraph) {
    cachedSubgraph[chainId] = undefined
  } else if (useSubgraph && SUBGRAPH_URL[chainId]) {
    cachedSubgraph[chainId] = new Subgraph(chainId)
  }
}
