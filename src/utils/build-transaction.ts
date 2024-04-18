import {
  encodeFunctionData,
  type SimulateContractParameters,
  type WriteContractParameters,
} from 'viem'

import { CHAIN_IDS, type Transaction } from '../type'
import { cachedPublicClients } from '../constants/client'

export const buildTransaction = async (
  chainId: CHAIN_IDS,
  args: WriteContractParameters | SimulateContractParameters,
  gasLimit?: bigint,
): Promise<Transaction> => {
  const data = encodeFunctionData(args)
  const [gas, gasPrice] = await Promise.all([
    gasLimit ??
      cachedPublicClients[chainId]!.estimateGas({
        account: args.account,
        data,
        to: args.address,
        value: args.value || 0n,
      }),
    cachedPublicClients[chainId]!.getGasPrice(),
  ])
  return {
    gas,
    gasPrice,
    data,
    value: args.value || 0n,
    to: args.address,
    from: args.account,
  }
}
