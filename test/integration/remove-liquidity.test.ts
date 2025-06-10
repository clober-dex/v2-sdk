import { expect, test } from 'vitest'
import { addLiquidity, removeLiquidity } from '@clober/v2-sdk'
import { formatUnits, zeroHash } from 'viem'

import { setUp } from '../setup'
import { MOCK_USDC } from '../utils/constants'
import { waitForTransaction } from '../utils/transaction'
import { getLpTokenBalance, getTokenBalance } from '../utils/currency'

test('Remove liquidity - 1', async () => {
  const { publicClient, walletClient, tokenAddress, pool } = await setUp('burn')

  await addLiquidity({
    chainId: publicClient.chain.id,
    userAddress: walletClient.account!.address,
    token0: tokenAddress,
    token1: MOCK_USDC,
    salt: zeroHash,
    amount0: '2000',
    amount1: '1.0',
    options: {
      rpcUrl: publicClient.transport.url!,
      useSubgraph: false,
    },
  }).then(({ transaction }) =>
    waitForTransaction({
      transaction: transaction!,
      publicClient,
      walletClient,
    }),
  )

  const [beforeUSDC, beforeToken, beforeLP] = await Promise.all([
    getTokenBalance({
      publicClient,
      tokenAddress: MOCK_USDC,
      userAddress: walletClient.account.address,
    }),
    getTokenBalance({
      publicClient,
      tokenAddress: tokenAddress,
      userAddress: walletClient.account.address,
    }),
    getLpTokenBalance({
      publicClient,
      tokenId: BigInt(pool.key),
      userAddress: walletClient.account.address,
    }),
  ])

  const { transaction, result } = await removeLiquidity({
    chainId: publicClient.chain.id,
    userAddress: walletClient.account!.address,
    token0: tokenAddress,
    token1: MOCK_USDC,
    salt: zeroHash,
    amount: Number(formatUnits(beforeLP / 2n, 18)).toString(),
    options: {
      rpcUrl: publicClient.transport.url!,
      useSubgraph: false,
    },
  })
  await waitForTransaction({
    transaction: transaction!,
    publicClient,
    walletClient,
  })

  const [afterUSDC, afterToken, afterLP] = await Promise.all([
    getTokenBalance({
      publicClient,
      tokenAddress: MOCK_USDC,
      userAddress: walletClient.account.address,
    }),
    getTokenBalance({
      publicClient,
      tokenAddress: tokenAddress,
      userAddress: walletClient.account.address,
    }),
    getLpTokenBalance({
      publicClient,
      tokenId: BigInt(pool.key),
      userAddress: walletClient.account.address,
    }),
  ])

  // contain small fee
  expect(formatUnits(afterUSDC - beforeUSDC, 6)).toBe('0.49995')
  expect(formatUnits(afterToken - beforeToken, 18)).toBe('999.9')
  expect(formatUnits(beforeLP - afterLP, 18)).toBe(result.lpCurrency.amount)
})

test('Remove liquidity - 2', async () => {
  const { publicClient, walletClient, tokenAddress, pool } = await setUp('burn')

  await addLiquidity({
    chainId: publicClient.chain.id,
    userAddress: walletClient.account!.address,
    token0: tokenAddress,
    token1: MOCK_USDC,
    salt: zeroHash,
    amount0: '2000',
    amount1: '1.0',
    options: {
      rpcUrl: publicClient.transport.url!,
      useSubgraph: false,
    },
  }).then(({ transaction }) =>
    waitForTransaction({
      transaction: transaction!,
      publicClient,
      walletClient,
    }),
  )

  const [beforeUSDC, beforeToken, beforeLP] = await Promise.all([
    getTokenBalance({
      publicClient,
      tokenAddress: MOCK_USDC,
      userAddress: walletClient.account.address,
    }),
    getTokenBalance({
      publicClient,
      tokenAddress: tokenAddress,
      userAddress: walletClient.account.address,
    }),
    getLpTokenBalance({
      publicClient,
      tokenId: BigInt(pool.key),
      userAddress: walletClient.account.address,
    }),
  ])

  const { transaction, result } = await removeLiquidity({
    chainId: publicClient.chain.id,
    userAddress: walletClient.account!.address,
    token0: tokenAddress,
    token1: MOCK_USDC,
    salt: zeroHash,
    amount: Number(formatUnits(beforeLP, 18)).toString(),
    options: {
      rpcUrl: publicClient.transport.url!,
      useSubgraph: false,
    },
  })
  await waitForTransaction({
    transaction: transaction!,
    publicClient,
    walletClient,
  })

  const [afterUSDC, afterToken, afterLP] = await Promise.all([
    getTokenBalance({
      publicClient,
      tokenAddress: MOCK_USDC,
      userAddress: walletClient.account.address,
    }),
    getTokenBalance({
      publicClient,
      tokenAddress: tokenAddress,
      userAddress: walletClient.account.address,
    }),
    getLpTokenBalance({
      publicClient,
      tokenId: BigInt(pool.key),
      userAddress: walletClient.account.address,
    }),
  ])

  // contain small fee
  expect(formatUnits(afterUSDC - beforeUSDC, 6)).toBe('0.9999')
  expect(formatUnits(afterToken - beforeToken, 18)).toBe('1999.8')
  expect(formatUnits(beforeLP - afterLP, 18)).toBe(result.lpCurrency.amount)
})
