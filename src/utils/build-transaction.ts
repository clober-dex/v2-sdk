import {
  createPublicClient,
  encodeFunctionData,
  http,
  SimulateContractParameters,
} from 'viem'

import { CHAIN_IDS, CHAIN_MAP } from '../constants/chain'
import { Transaction } from '../type'

export const buildTransaction = async (
  chainId: CHAIN_IDS,
  args: SimulateContractParameters,
): Promise<Transaction> => {
  const publicClient = createPublicClient({
    chain: CHAIN_MAP[chainId],
    transport: http(),
  })
  const [gas, gasPrice] = await Promise.all([
    publicClient.estimateContractGas(args as SimulateContractParameters),
    publicClient.getGasPrice(),
  ])
  const data = encodeFunctionData(args as SimulateContractParameters)
  return {
    gas,
    gasPrice,
    data,
    value: args.value || 0n,
    to: args.address,
  }
}
