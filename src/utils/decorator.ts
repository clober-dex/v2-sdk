import { CHAIN_IDS, type DefaultOptions } from '../type'
import { buildSubgraph } from '../constants/subgraph'

export function decorator<
  Args extends {
    chainId: CHAIN_IDS
    options: DefaultOptions
  } & any,
  R,
>(fn: (args: Args) => Promise<R>) {
  return async (args: Args) => {
    const { chainId, options } = args as {
      chainId: CHAIN_IDS
      options?: DefaultOptions
    }
    buildSubgraph(chainId, options?.useSubgraph)

    const results = await fn(args)
    // clean cache for next call
    buildSubgraph(chainId)

    return results
  }
}
