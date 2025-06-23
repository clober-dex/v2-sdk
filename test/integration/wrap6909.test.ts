import { expect, test } from 'vitest'
import {
  addLiquidity,
  wrapToERC20,
  unwrapFromERC20,
  getContractAddresses,
} from '@clober/v2-sdk'
import { formatUnits, zeroHash } from 'viem'

import { setUp } from '../setup'
import { getLpTokenBalance, getTokenBalance } from '../utils/currency'
import { MOCK_USDC } from '../utils/constants'
import { waitForTransaction } from '../utils/transaction'

test('wrap to ERC20 and unwrap to ERC6909', async () => {
  const { publicClient, walletClient, tokenAddress, pool } = await setUp('wrap')

  await addLiquidity({
    chainId: publicClient.chain.id,
    userAddress: walletClient.account.address,
    token0: MOCK_USDC,
    token1: tokenAddress,
    salt: zeroHash,
    amount0: '2000',
    amount1: '1.0',
    options: {
      rpcUrl: publicClient.transport.url!,
      useSubgraph: false,
      disableSwap: true,
    },
  }).then(({ transaction }) =>
    waitForTransaction({
      transaction: transaction!,
      publicClient,
      walletClient,
    }),
  )

  const lpAmount1 = await getLpTokenBalance({
    publicClient,
    tokenId: BigInt(pool.key),
    userAddress: walletClient.account.address,
  })

  await walletClient
    .writeContract({
      account: walletClient.account!,
      chain: walletClient.chain!,
      address: getContractAddresses({ chainId: publicClient.chain.id })
        .Rebalancer,
      abi: [
        {
          inputs: [
            { internalType: 'address', name: 'spender', type: 'address' },
            { internalType: 'uint256', name: 'id', type: 'uint256' },
            { internalType: 'uint256', name: 'amount', type: 'uint256' },
          ],
          stateMutability: 'nonpayable',
          type: 'function',
          name: 'approve',
          outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
        },
      ] as const,
      functionName: 'approve',
      args: [
        getContractAddresses({ chainId: publicClient.chain.id })
          .Wrapped6909Factory,
        BigInt(pool.key),
        2n ** 256n - 1n, // Approve max amount
      ],
    })
    .then(async (hash) => {
      await publicClient.waitForTransactionReceipt({
        hash,
      })
    })

  const { transaction: transaction1, result: wrapResult } = await wrapToERC20({
    chainId: publicClient.chain.id,
    userAddress: walletClient.account.address,
    token0: MOCK_USDC,
    token1: tokenAddress,
    salt: zeroHash,
    amount: '1000',
    options: {
      rpcUrl: publicClient.transport.url!,
      useSubgraph: false,
    },
  })
  await waitForTransaction({
    transaction: transaction1!,
    publicClient,
    walletClient,
  })

  const [tokenAmount1, lpAmount2] = await Promise.all([
    getTokenBalance({
      publicClient,
      tokenAddress: wrapResult.currency.address,
      userAddress: walletClient.account.address,
    }),
    getLpTokenBalance({
      publicClient,
      tokenId: BigInt(pool.key),
      userAddress: walletClient.account.address,
    }),
  ])

  expect(wrapResult.direction).toBe('out')
  expect(formatUnits(tokenAmount1, 18)).toBe(wrapResult.amount)
  expect(formatUnits(lpAmount1 - lpAmount2, 18)).toBe(wrapResult.amount)

  const { transaction: transaction2, result: unwrapResult } =
    await unwrapFromERC20({
      chainId: publicClient.chain.id,
      userAddress: walletClient.account.address,
      token0: MOCK_USDC,
      token1: tokenAddress,
      salt: zeroHash,
      amount: '1000',
      options: {
        rpcUrl: publicClient.transport.url!,
        useSubgraph: false,
      },
    })
  await waitForTransaction({
    transaction: transaction2!,
    publicClient,
    walletClient,
  })

  const [tokenAmount2, lpAmount3] = await Promise.all([
    getTokenBalance({
      publicClient,
      tokenAddress: unwrapResult.currency.address,
      userAddress: walletClient.account.address,
    }),
    getLpTokenBalance({
      publicClient,
      tokenId: BigInt(pool.key),
      userAddress: walletClient.account.address,
    }),
  ])

  expect(unwrapResult.direction).toBe('in')
  expect(formatUnits(tokenAmount2, 18)).toBe('0')
  expect(formatUnits(lpAmount3 - lpAmount2, 18)).toBe(unwrapResult.amount)
})
