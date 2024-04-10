import { SUBGRAPH_URL } from '../constants/subgraph-url'
import { CHAIN_IDS } from '../constants/chain'

export async function fetchSubgraph<T>(
  chainId: CHAIN_IDS,
  operationName: string,
  query: string,
  variables: {},
): Promise<T> {
  const response = await fetch(SUBGRAPH_URL[chainId]!, {
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
    return response.json()
  } else {
    const errorResponse = await response.json()

    throw new Error(errorResponse.message || 'Unknown Error')
  }
}
