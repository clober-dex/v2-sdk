import { CHAIN_IDS } from '../../src'
import { cachedPublicClients } from '../../src/constants/client'

const _abi = [
  {
    inputs: [
      {
        internalType: 'address',
        name: 'account',
        type: 'address',
      },
    ],
    name: 'balanceOf',
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

export const fetchTokenBalance = async (
  chainId: CHAIN_IDS,
  token: `0x${string}`,
  userAddress: `0x${string}`,
): Promise<bigint> => {
  return cachedPublicClients[chainId]!.readContract({
    address: token,
    abi: _abi,
    functionName: 'balanceOf',
    args: [userAddress],
  })
}
