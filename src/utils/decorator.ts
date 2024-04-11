import { CHAIN_IDS, DefaultOptions } from '../type'
import { buildPublicClient } from '../constants/client'

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
      options: DefaultOptions
    }
    buildPublicClient(chainId, options.rpcUrl)
    return fn(args)
  }
}
