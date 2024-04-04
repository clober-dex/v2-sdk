import {
  createPublicClient,
  encodeFunctionData,
  http,
  SimulateContractParameters,
  WriteContractParameters,
} from 'viem'

import { CHAIN_IDS, CHAIN_MAP } from '../constants/chain'
import { Transaction } from '../type'

export const buildTransaction = async (
  chainId: CHAIN_IDS,
  args: WriteContractParameters | SimulateContractParameters,
): Promise<Transaction> => {
  const publicClient = createPublicClient({
    chain: CHAIN_MAP[chainId],
    transport: http(),
  })
  const data = encodeFunctionData(args)
  const [gas, gasPrice] = await Promise.all([
    publicClient.estimateGas({
      account: args.account,
      data,
      to: args.address,
      value: args.value || 0n,
    }),
    publicClient.getGasPrice(),
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
