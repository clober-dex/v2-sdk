import { isAddressEqual, PublicClient, WalletClient, zeroAddress } from 'viem'
import { getContractAddresses } from '@clober/v2-sdk'

import { erc20Abi } from './constants'

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
