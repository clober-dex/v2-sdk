import { CHAIN_IDS, type DefaultOptions } from '../type'
import { buildPublicClient } from '../constants/client'
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
    buildPublicClient(chainId, options?.rpcUrl)
    buildSubgraph(chainId, options?.useSubgraph)
    return fn(args)
  }
}
