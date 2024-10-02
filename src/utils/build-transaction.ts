import {
  encodeFunctionData,
  PublicClient,
  type SimulateContractParameters,
  type WriteContractParameters,
} from 'viem'

import { type Transaction } from '../type'

export const buildTransaction = async (
  publicClient: PublicClient,
  args: WriteContractParameters | SimulateContractParameters,
  gasLimit?: bigint,
  gasPriceLimit?: bigint,
): Promise<Transaction> => {
  const data = encodeFunctionData(args)
  const [gas, gasPrice] = await Promise.all([
    gasLimit ??
      publicClient.estimateGas({
        account: args.account,
        data,
        to: args.address,
        value: args.value || 0n,
      }),
    gasPriceLimit ?? publicClient.getGasPrice(),
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
