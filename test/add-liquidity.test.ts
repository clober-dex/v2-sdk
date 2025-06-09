import { expect, test } from 'vitest'
import { addLiquidity } from '@clober/v2-sdk'
import { formatUnits, zeroHash } from 'viem'

import { setUp } from './setup'
import { getLpTokenBalance, getTokenBalance } from './utils/currency'
import { MOCK_USDC } from './constants'
import { waitForTransaction } from './utils/transaction'

test('Add liquidity without swap - 1', async () => {
  const { publicClient, walletClient, tokenAddress, pool } = await setUp('mint')

  let [beforeUSDC, beforeToken, beforeLP] = await Promise.all([
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

  const { transaction: transaction1, result: result1 } = await addLiquidity({
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
  })
  await waitForTransaction({
    transaction: transaction1!,
    publicClient,
    walletClient,
  })

  let [afterUSDC, afterToken, afterLP] = await Promise.all([
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

  expect(formatUnits(beforeUSDC - afterUSDC, 6)).toBe(result1.currencyA.amount)
  expect(formatUnits(beforeToken - afterToken, 18)).toBe(
    result1.currencyB.amount,
  )
  expect(formatUnits(afterLP - beforeLP, 18)).toBe(result1.lpCurrency.amount)

  // add liquidity more
  ;[beforeUSDC, beforeToken, beforeLP] = await Promise.all([
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

  const { transaction: transaction2, result: result2 } = await addLiquidity({
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
  })

  await waitForTransaction({
    transaction: transaction2!,
    publicClient,
    walletClient,
  })
  ;[afterUSDC, afterToken, afterLP] = await Promise.all([
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

  expect(formatUnits(beforeUSDC - afterUSDC, 6)).toBe(result2.currencyA.amount)
  expect(formatUnits(beforeToken - afterToken, 18)).toBe(
    result2.currencyB.amount,
  )
  expect(formatUnits(afterLP - beforeLP, 18)).toBe(result2.lpCurrency.amount)
})

test('Add liquidity without swap - 2', async () => {
  const { publicClient, walletClient, tokenAddress, pool } = await setUp('mint')

  let [beforeUSDC, beforeToken, beforeLP] = await Promise.all([
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

  const { transaction: transaction1, result: result1 } = await addLiquidity({
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
  })
  await waitForTransaction({
    transaction: transaction1!,
    publicClient,
    walletClient,
  })

  let [afterUSDC, afterToken, afterLP] = await Promise.all([
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

  expect(formatUnits(beforeUSDC - afterUSDC, 6)).toBe(result1.currencyA.amount)
  expect(formatUnits(beforeToken - afterToken, 18)).toBe(
    result1.currencyB.amount,
  )
  expect(formatUnits(afterLP - beforeLP, 18)).toBe(result1.lpCurrency.amount)

  // add liquidity more
  ;[beforeUSDC, beforeToken, beforeLP] = await Promise.all([
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

  const { transaction: transaction2, result: result2 } = await addLiquidity({
    chainId: publicClient.chain.id,
    userAddress: walletClient.account.address,
    token0: MOCK_USDC,
    token1: tokenAddress,
    salt: zeroHash,
    amount0: '8000',
    amount1: '4.0',
    options: {
      rpcUrl: publicClient.transport.url!,
      useSubgraph: false,
      disableSwap: true,
    },
  })

  await waitForTransaction({
    transaction: transaction2!,
    publicClient,
    walletClient,
  })
  ;[afterUSDC, afterToken, afterLP] = await Promise.all([
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

  expect(formatUnits(beforeUSDC - afterUSDC, 6)).toBe(result2.currencyA.amount)
  expect(formatUnits(beforeToken - afterToken, 18)).toBe(
    result2.currencyB.amount,
  )
  expect(formatUnits(afterLP - beforeLP, 18)).toBe(result2.lpCurrency.amount)
})
