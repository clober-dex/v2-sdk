// @TODO: remove this file

import { PublicClient } from 'viem'

import { CHAIN_IDS } from '../../src'
import { CONTRACT_ADDRESSES } from '../../src/constants/chain-configs/addresses'

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
  publicClient: PublicClient,
  chainId: CHAIN_IDS,
  token: `0x${string}`,
  userAddress: `0x${string}`,
): Promise<bigint> => {
  return publicClient.readContract({
    address: token,
    abi: _abi,
    functionName: 'balanceOf',
    args: [userAddress],
  })
}

export const fetchLPBalance = async (
  publicClient: PublicClient,
  chainId: CHAIN_IDS,
  tokenId: bigint,
  userAddress: `0x${string}`,
): Promise<bigint> => {
  return publicClient.readContract({
    address: CONTRACT_ADDRESSES[chainId]!.Rebalancer,
    abi: [
      {
        inputs: [
          {
            internalType: 'address',
            name: '',
            type: 'address',
          },
          {
            internalType: 'uint256',
            name: '',
            type: 'uint256',
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
    ] as const,
    functionName: 'balanceOf',
    args: [userAddress, tokenId],
  })
}
