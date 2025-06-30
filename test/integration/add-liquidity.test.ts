import { expect, test } from 'vitest'
import {
  limitOrder,
  Transaction,
  addLiquidity,
  adjustOrderPrice,
  getContractAddresses,
} from '@clober/v2-sdk'
import { formatUnits, parseUnits, zeroHash } from 'viem'

import { getQuoteAmountFromPrices } from '../../src/entities/pool/utils/mint'
import { setUp } from '../setup'
import { getLpTokenBalance, getTokenBalance } from '../utils/currency'
import { DEV_WALLET, MOCK_USDC } from '../utils/constants'
import { waitForTransaction } from '../utils/transaction'
import type { Currency } from '../../src'
import { marketOrder } from '../../src'
import { STRATEGY_ABI } from '../../src/constants/abis/rebalancer/strategy-abi'

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

test('quote amount from prices when adding liquidity', () => {
  expect(getQuoteAmountFromPrices(1000000n, 0.9999, 1847.11, 6, 18)).toEqual(
    541332135065047n,
  )

  expect(
    getQuoteAmountFromPrices(1000000000000000000n, 1847.11, 0.9999, 18, 6),
  ).toEqual(1847294729n)
})

test('Add liquidity one side with swap - 1', async () => {
  const { publicClient, walletClient, tokenAddress, pool } = await setUp('mint')
  const cloberQuote = async (
    inputCurrency: Currency,
    amountIn: bigint,
    outputCurrency: Currency,
    slippageLimitPercent: number,
    // @ts-ignore
    gasPrice: bigint,
    userAddress: `0x${string}`,
  ): Promise<{
    amountOut: bigint
    transaction: Transaction | undefined
  }> => {
    const {
      transaction,
      result: {
        taken: {
          amount,
          currency: { decimals },
          events,
        },
      },
    } = await marketOrder({
      chainId: publicClient.chain.id,
      userAddress: userAddress!,
      inputToken: inputCurrency.address,
      outputToken: outputCurrency.address,
      amountIn: formatUnits(amountIn, inputCurrency.decimals),
      options: {
        rpcUrl: publicClient.transport.url!,
        useSubgraph: false,
        slippage: slippageLimitPercent,
        gasLimit: 300_000n,
      },
    })
    return {
      transaction: {
        ...transaction,
        gas: 300_000n * BigInt(events.length),
        from: userAddress,
      },
      amountOut: parseUnits(amount, decimals),
    }
  }

  await walletClient
    .writeContract({
      account: DEV_WALLET,
      address: getContractAddresses({ chainId: publicClient.chain.id })!
        .Strategy,
      abi: STRATEGY_ABI,
      functionName: 'setConfig',
      args: [
        pool.key,
        {
          referenceThreshold: 10000,
          rebalanceThreshold: 50000,
          rateA: 1000000,
          rateB: 1000000,
          minRateA: 1000000,
          minRateB: 1000000,
          priceThresholdA: 10000,
          priceThresholdB: 10000,
        },
      ],
    })
    .then((hash) => publicClient.waitForTransactionReceipt({ hash }))

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
  }).then(async ({ transaction }) =>
    waitForTransaction({
      transaction: transaction!,
      publicClient,
      walletClient,
    }),
  )

  await adjustOrderPrice({
    chainId: publicClient.chain.id,
    userAddress: DEV_WALLET,
    token0: MOCK_USDC,
    token1: tokenAddress,
    salt: zeroHash,
    oraclePrice: '2000',
    bidPrice: '1999',
    askPrice: '2001',
    alpha: '0.5',
    options: {
      rpcUrl: publicClient.transport.url!,
      useSubgraph: false,
    },
  }).then((transaction) =>
    waitForTransaction({
      transaction: transaction!,
      walletClient,
      publicClient,
    }),
  )
  await limitOrder({
    chainId: publicClient.chain.id,
    userAddress: walletClient.account.address,
    inputToken: MOCK_USDC,
    outputToken: tokenAddress,
    amount: '20000',
    price: '1999.5',
    options: {
      rpcUrl: publicClient.transport.url!,
      postOnly: true,
      useSubgraph: false,
    },
  }).then(({ transaction }) =>
    waitForTransaction({ transaction, publicClient, walletClient }),
  )

  await limitOrder({
    chainId: publicClient.chain.id,
    userAddress: walletClient.account.address,
    inputToken: tokenAddress,
    outputToken: MOCK_USDC,
    amount: '20',
    price: '2000.5',
    options: {
      rpcUrl: publicClient.transport.url!,
      postOnly: true,
      useSubgraph: false,
    },
  }).then(({ transaction }) =>
    waitForTransaction({ transaction, publicClient, walletClient }),
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

  // add liquidity with swap
  const { transaction, result } = await addLiquidity({
    chainId: publicClient.chain.id,
    userAddress: walletClient.account.address,
    token0: MOCK_USDC,
    token1: tokenAddress,
    salt: zeroHash,
    amount0: '2000',
    amount1: '0',
    quotes: [cloberQuote as any],
    options: {
      rpcUrl: publicClient.transport.url!,
      useSubgraph: false,
      disableSwap: false,
      slippage: 5,
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
  expect(Number(formatUnits(beforeUSDC - afterUSDC, 6)).toFixed(2)).toBe(
    Number(result.currencyA.amount).toFixed(2),
  )
  expect(formatUnits(beforeToken - afterToken, 18)).toBe('0')
  expect(formatUnits(afterLP - beforeLP, 18)).toBe(result.lpCurrency.amount)
})

test('Add liquidity one side with swap - 2', async () => {
  const { publicClient, walletClient, tokenAddress, pool } = await setUp('mint')
  const cloberQuote = async (
    inputCurrency: Currency,
    amountIn: bigint,
    outputCurrency: Currency,
    slippageLimitPercent: number,
    // @ts-ignore
    gasPrice: bigint,
    userAddress: `0x${string}`,
  ): Promise<{
    amountOut: bigint
    transaction: Transaction | undefined
  }> => {
    const {
      transaction,
      result: {
        taken: {
          amount,
          currency: { decimals },
          events,
        },
      },
    } = await marketOrder({
      chainId: publicClient.chain.id,
      userAddress: userAddress!,
      inputToken: inputCurrency.address,
      outputToken: outputCurrency.address,
      amountIn: formatUnits(amountIn, inputCurrency.decimals),
      options: {
        rpcUrl: publicClient.transport.url!,
        useSubgraph: false,
        slippage: slippageLimitPercent,
        gasLimit: 300_000n,
      },
    })
    return {
      transaction: {
        ...transaction,
        gas: 300_000n * BigInt(events.length),
        from: userAddress,
      },
      amountOut: parseUnits(amount, decimals),
    }
  }

  await walletClient
    .writeContract({
      account: DEV_WALLET,
      address: getContractAddresses({ chainId: publicClient.chain.id })!
        .Strategy,
      abi: STRATEGY_ABI,
      functionName: 'setConfig',
      args: [
        pool.key,
        {
          referenceThreshold: 10000,
          rebalanceThreshold: 50000,
          rateA: 1000000,
          rateB: 1000000,
          minRateA: 1000000,
          minRateB: 1000000,
          priceThresholdA: 10000,
          priceThresholdB: 10000,
        },
      ],
    })
    .then((hash) => publicClient.waitForTransactionReceipt({ hash }))

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
  }).then(async ({ transaction }) =>
    waitForTransaction({
      transaction: transaction!,
      publicClient,
      walletClient,
    }),
  )

  await adjustOrderPrice({
    chainId: publicClient.chain.id,
    userAddress: DEV_WALLET,
    token0: MOCK_USDC,
    token1: tokenAddress,
    salt: zeroHash,
    oraclePrice: '2000',
    bidPrice: '1999',
    askPrice: '2001',
    alpha: '0.5',
    options: {
      rpcUrl: publicClient.transport.url!,
      useSubgraph: false,
    },
  }).then((transaction) =>
    waitForTransaction({
      transaction: transaction!,
      walletClient,
      publicClient,
    }),
  )
  await limitOrder({
    chainId: publicClient.chain.id,
    userAddress: walletClient.account.address,
    inputToken: MOCK_USDC,
    outputToken: tokenAddress,
    amount: '20000',
    price: '1999.5',
    options: {
      rpcUrl: publicClient.transport.url!,
      postOnly: true,
      useSubgraph: false,
    },
  }).then(({ transaction }) =>
    waitForTransaction({ transaction, publicClient, walletClient }),
  )

  await limitOrder({
    chainId: publicClient.chain.id,
    userAddress: walletClient.account.address,
    inputToken: tokenAddress,
    outputToken: MOCK_USDC,
    amount: '20',
    price: '2000.5',
    options: {
      rpcUrl: publicClient.transport.url!,
      postOnly: true,
      useSubgraph: false,
    },
  }).then(({ transaction }) =>
    waitForTransaction({ transaction, publicClient, walletClient }),
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

  // add liquidity with swap
  const { transaction, result } = await addLiquidity({
    chainId: publicClient.chain.id,
    userAddress: walletClient.account.address,
    token0: MOCK_USDC,
    token1: tokenAddress,
    salt: zeroHash,
    amount0: '0',
    amount1: '1.0',
    quotes: [cloberQuote as any],
    options: {
      rpcUrl: publicClient.transport.url!,
      useSubgraph: false,
      disableSwap: false,
      slippage: 5,
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
  expect(formatUnits(beforeUSDC - afterUSDC, 6)).toBe('0')
  expect(Number(formatUnits(beforeToken - afterToken, 18)).toFixed(9)).toBe(
    Number(result.currencyB.amount).toFixed(9),
  )
  expect(formatUnits(afterLP - beforeLP, 18)).toBe(result.lpCurrency.amount)
})

test('Add liquidity one side with swap - 3', async () => {
  const { publicClient, walletClient, tokenAddress, pool } = await setUp('mint')
  const cloberQuote = async (
    inputCurrency: Currency,
    amountIn: bigint,
    outputCurrency: Currency,
    slippageLimitPercent: number,
    // @ts-ignore
    gasPrice: bigint,
    userAddress: `0x${string}`,
  ): Promise<{
    amountOut: bigint
    transaction: Transaction | undefined
  }> => {
    const {
      transaction,
      result: {
        taken: {
          amount,
          currency: { decimals },
          events,
        },
      },
    } = await marketOrder({
      chainId: publicClient.chain.id,
      userAddress: userAddress!,
      inputToken: inputCurrency.address,
      outputToken: outputCurrency.address,
      amountIn: formatUnits(amountIn, inputCurrency.decimals),
      options: {
        rpcUrl: publicClient.transport.url!,
        useSubgraph: false,
        slippage: slippageLimitPercent,
        gasLimit: 300_000n,
      },
    })
    return {
      transaction: {
        ...transaction,
        gas: 300_000n * BigInt(events.length),
        from: userAddress,
      },
      amountOut: parseUnits(amount, decimals),
    }
  }

  await walletClient
    .writeContract({
      account: DEV_WALLET,
      address: getContractAddresses({ chainId: publicClient.chain.id })!
        .Strategy,
      abi: STRATEGY_ABI,
      functionName: 'setConfig',
      args: [
        pool.key,
        {
          referenceThreshold: 10000,
          rebalanceThreshold: 50000,
          rateA: 1000000,
          rateB: 1000000,
          minRateA: 1000000,
          minRateB: 1000000,
          priceThresholdA: 10000,
          priceThresholdB: 10000,
        },
      ],
    })
    .then((hash) => publicClient.waitForTransactionReceipt({ hash }))

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
  }).then(async ({ transaction }) =>
    waitForTransaction({
      transaction: transaction!,
      publicClient,
      walletClient,
    }),
  )

  await adjustOrderPrice({
    chainId: publicClient.chain.id,
    userAddress: DEV_WALLET,
    token0: MOCK_USDC,
    token1: tokenAddress,
    salt: zeroHash,
    oraclePrice: '2000',
    bidPrice: '1999',
    askPrice: '2001',
    alpha: '0.5',
    options: {
      rpcUrl: publicClient.transport.url!,
      useSubgraph: false,
    },
  }).then((transaction) =>
    waitForTransaction({
      transaction: transaction!,
      walletClient,
      publicClient,
    }),
  )
  await limitOrder({
    chainId: publicClient.chain.id,
    userAddress: walletClient.account.address,
    inputToken: MOCK_USDC,
    outputToken: tokenAddress,
    amount: '20000',
    price: '1999.5',
    options: {
      rpcUrl: publicClient.transport.url!,
      postOnly: true,
      useSubgraph: false,
    },
  }).then(({ transaction }) =>
    waitForTransaction({ transaction, publicClient, walletClient }),
  )

  await limitOrder({
    chainId: publicClient.chain.id,
    userAddress: walletClient.account.address,
    inputToken: tokenAddress,
    outputToken: MOCK_USDC,
    amount: '20',
    price: '2000.5',
    options: {
      rpcUrl: publicClient.transport.url!,
      postOnly: true,
      useSubgraph: false,
    },
  }).then(({ transaction }) =>
    waitForTransaction({ transaction, publicClient, walletClient }),
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

  // add liquidity with swap
  const { transaction, result } = await addLiquidity({
    chainId: publicClient.chain.id,
    userAddress: walletClient.account.address,
    token0: MOCK_USDC,
    token1: tokenAddress,
    salt: zeroHash,
    amount0: '1000',
    amount1: '1.0',
    quotes: [cloberQuote as any],
    options: {
      rpcUrl: publicClient.transport.url!,
      useSubgraph: false,
      disableSwap: false,
      slippage: 5,
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
  expect(Number(formatUnits(beforeUSDC - afterUSDC, 6)).toFixed(2)).toBe(
    Number(result.currencyA.amount).toFixed(2),
  )
  expect(Number(formatUnits(beforeToken - afterToken, 18)).toFixed(9)).toBe(
    Number(result.currencyB.amount).toFixed(9),
  )
  expect(formatUnits(afterLP - beforeLP, 18)).toBe(result.lpCurrency.amount)
})
