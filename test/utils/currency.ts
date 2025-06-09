import { isAddressEqual, PublicClient, WalletClient, zeroAddress } from 'viem'
import { CHAIN_IDS, getContractAddresses } from '@clober/v2-sdk'

import { CONTRACT_ADDRESSES } from '../../src/constants/chain-configs/addresses'
import { erc20Abi } from '../constants'

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

export const getTokenBalance = async ({
  publicClient,
  tokenAddress,
  userAddress,
}: {
  publicClient: PublicClient
  tokenAddress: `0x${string}`
  userAddress: `0x${string}`
}): Promise<bigint> => {
  if (isAddressEqual(tokenAddress, zeroAddress)) {
    return publicClient.getBalance({ address: userAddress })
  }
  return publicClient.readContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [userAddress],
  })
}

export const getLpTokenBalance = async ({
  publicClient,
  tokenId,
  userAddress,
}: {
  publicClient: PublicClient
  tokenId: bigint
  userAddress: `0x${string}`
}): Promise<bigint> => {
  return publicClient.readContract({
    address: getContractAddresses({ chainId: publicClient.chain!.id })
      .Rebalancer,
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

export const maxApproveToken = async ({
  token,
  spender,
  walletClient,
}: {
  token: `0x${string}`
  spender: `0x${string}`
  walletClient: WalletClient
}) => {
  return walletClient.writeContract({
    account: walletClient.account!,
    chain: walletClient.chain!,
    address: token,
    abi: [
      {
        inputs: [
          {
            internalType: 'address',
            name: 'spender',
            type: 'address',
          },
          {
            internalType: 'uint256',
            name: 'value',
            type: 'uint256',
          },
        ],
        name: 'approve',
        outputs: [
          {
            internalType: 'bool',
            name: '',
            type: 'bool',
          },
        ],
        stateMutability: 'nonpayable',
        type: 'function',
      },
    ] as const,
    functionName: 'approve',
    args: [spender, 2n ** 256n - 1n],
  })
}

// @TODO: remove this function
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

// @TODO: remove this function
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
