import { cachedPublicClients } from '../constants/client'
import { CHAIN_IDS } from '../constants/chain'

const _abi = [
  {
    inputs: [
      {
        internalType: 'address',
        name: 'owner',
        type: 'address',
      },
      {
        internalType: 'address',
        name: 'spender',
        type: 'address',
      },
    ],
    name: 'allowance',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const

export async function fetchAllowance(
  chainId: CHAIN_IDS,
  token: `0x${string}`,
  userAddress: `0x${string}`,
  spenderAddress: `0x${string}`,
): Promise<bigint> {
  return cachedPublicClients[chainId].readContract({
    address: token,
    abi: _abi,
    functionName: 'allowance',
    args: [userAddress, spenderAddress],
  })
}
