import { expect, test } from 'vitest'
import { addLiquidity } from '@clober/v2-sdk'
import { formatUnits, zeroHash } from 'viem'

import { getQuoteAmountFromPrices } from '../src/entities/pool/utils/mint'

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

test('quote amount from prices when adding liquidity', () => {
  expect(getQuoteAmountFromPrices(1000000n, 0.9999, 1847.11, 6, 18)).toEqual(
    541332135065047n,
  )

  expect(
    getQuoteAmountFromPrices(1000000000000000000n, 1847.11, 0.9999, 18, 6),
  ).toEqual(1847294729n)
})

// TODO: remove comment when other aggregators are ready
// test('Add liquidity one side with swap', async () => {
//   const { publicClient, walletClient, testClient } = clients[0] as any
//
//   await setting(publicClient, walletClient, testClient)
//
//   const pool = await getPool({
//     chainId: cloberTestChain2.id,
//     token0: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
//     token1: '0xF2e615A933825De4B39b497f6e6991418Fb31b78',
//     salt: zeroHash,
//     options: {
//       rpcUrl: publicClient.transport.url!,
//       useSubgraph: false,
//     },
//   })
//
//   let [beforeUSDCBalance, beforeWETHBalance, beforeLPBalance] =
//     await Promise.all([
//       fetchTokenBalance(
//         publicClient,
//         cloberTestChain2.id,
//         '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
//         '0x5F79EE8f8fA862E98201120d83c4eC39D9468D49',
//       ),
//       fetchTokenBalance(
//         publicClient,
//         cloberTestChain2.id,
//         '0xF2e615A933825De4B39b497f6e6991418Fb31b78',
//         '0x5F79EE8f8fA862E98201120d83c4eC39D9468D49',
//       ),
//       fetchLPBalance(
//         publicClient,
//         cloberTestChain2.id,
//         BigInt(pool.key),
//         '0x5F79EE8f8fA862E98201120d83c4eC39D9468D49',
//       ),
//     ])
//
//   const { transaction: tx1, result: result1 } = await addLiquidity({
//     chainId: cloberTestChain2.id,
//     userAddress: '0x5F79EE8f8fA862E98201120d83c4eC39D9468D49',
//     token0: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
//     token1: '0xF2e615A933825De4B39b497f6e6991418Fb31b78',
//     salt: zeroHash,
//     amount0: '2000',
//     amount1: '1.0',
//     options: {
//       rpcUrl: publicClient.transport.url!,
//       useSubgraph: false,
//       disableSwap: true,
//     },
//   })
//
//   const hash1 = await walletClient.sendTransaction({
//     ...tx1!,
//     account: '0x5F79EE8f8fA862E98201120d83c4eC39D9468D49',
//     gasPrice: tx1!.gasPrice! * 2n,
//   })
//   await publicClient.waitForTransactionReceipt({ hash: hash1 })
//   let [afterUSDCBalance, afterWETHBalance, afterLPBalance] = await Promise.all([
//     fetchTokenBalance(
//       publicClient,
//       cloberTestChain2.id,
//       '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
//       '0x5F79EE8f8fA862E98201120d83c4eC39D9468D49',
//     ),
//     fetchTokenBalance(
//       publicClient,
//       cloberTestChain2.id,
//       '0xF2e615A933825De4B39b497f6e6991418Fb31b78',
//       '0x5F79EE8f8fA862E98201120d83c4eC39D9468D49',
//     ),
//     fetchLPBalance(
//       publicClient,
//       cloberTestChain2.id,
//       BigInt(pool.key),
//       '0x5F79EE8f8fA862E98201120d83c4eC39D9468D49',
//     ),
//   ])
//   expect(formatUnits(beforeUSDCBalance - afterUSDCBalance, 6)).toBe(
//     result1.currencyA.amount,
//   )
//   expect(formatUnits(beforeWETHBalance - afterWETHBalance, 18)).toBe(
//     result1.currencyB.amount,
//   )
//   expect(formatUnits(afterLPBalance - beforeLPBalance, 18)).toBe(
//     result1.lpCurrency.amount,
//   )
//
//   // add liquidity more
//   ;[beforeUSDCBalance, beforeWETHBalance, beforeLPBalance] = await Promise.all([
//     fetchTokenBalance(
//       publicClient,
//       cloberTestChain2.id,
//       '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
//       '0x5F79EE8f8fA862E98201120d83c4eC39D9468D49',
//     ),
//     fetchTokenBalance(
//       publicClient,
//       cloberTestChain2.id,
//       '0xF2e615A933825De4B39b497f6e6991418Fb31b78',
//       '0x5F79EE8f8fA862E98201120d83c4eC39D9468D49',
//     ),
//     fetchLPBalance(
//       publicClient,
//       cloberTestChain2.id,
//       BigInt(pool.key),
//       '0x5F79EE8f8fA862E98201120d83c4eC39D9468D49',
//     ),
//   ])
//
//   const { transaction: tx2, result: result2 } = await addLiquidity({
//     chainId: cloberTestChain2.id,
//     userAddress: '0x5F79EE8f8fA862E98201120d83c4eC39D9468D49',
//     token0: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
//     token1: '0xF2e615A933825De4B39b497f6e6991418Fb31b78',
//     salt: zeroHash,
//     amount0: '2000',
//     amount1: '0',
//     options: {
//       rpcUrl: publicClient.transport.url!,
//       useSubgraph: false,
//       testnetPrice: 2000,
//     },
//   })
//
//   const hash2 = await walletClient.sendTransaction({
//     ...tx2!,
//     account: '0x5F79EE8f8fA862E98201120d83c4eC39D9468D49',
//     gasPrice: tx2!.gasPrice! * 2n,
//   })
//   await publicClient.waitForTransactionReceipt({ hash: hash2 })
//   ;[afterUSDCBalance, afterWETHBalance, afterLPBalance] = await Promise.all([
//     fetchTokenBalance(
//       publicClient,
//       cloberTestChain2.id,
//       '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
//       '0x5F79EE8f8fA862E98201120d83c4eC39D9468D49',
//     ),
//     fetchTokenBalance(
//       publicClient,
//       cloberTestChain2.id,
//       '0xF2e615A933825De4B39b497f6e6991418Fb31b78',
//       '0x5F79EE8f8fA862E98201120d83c4eC39D9468D49',
//     ),
//     fetchLPBalance(
//       publicClient,
//       cloberTestChain2.id,
//       BigInt(pool.key),
//       '0x5F79EE8f8fA862E98201120d83c4eC39D9468D49',
//     ),
//   ])
//
//   expect(formatUnits(beforeUSDCBalance - afterUSDCBalance, 6)).toBe(
//     result2.currencyA.amount,
//   )
//   expect(formatUnits(beforeWETHBalance - afterWETHBalance, 18)).toBe(
//     result2.currencyB.amount,
//   )
//   expect(formatUnits(afterLPBalance - beforeLPBalance, 18)).toBe(
//     result2.lpCurrency.amount,
//   )
//
//   // add liquidity more
//   ;[beforeUSDCBalance, beforeWETHBalance, beforeLPBalance] = await Promise.all([
//     fetchTokenBalance(
//       publicClient,
//       cloberTestChain2.id,
//       '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
//       '0x5F79EE8f8fA862E98201120d83c4eC39D9468D49',
//     ),
//     fetchTokenBalance(
//       publicClient,
//       cloberTestChain2.id,
//       '0xF2e615A933825De4B39b497f6e6991418Fb31b78',
//       '0x5F79EE8f8fA862E98201120d83c4eC39D9468D49',
//     ),
//     fetchLPBalance(
//       publicClient,
//       cloberTestChain2.id,
//       BigInt(pool.key),
//       '0x5F79EE8f8fA862E98201120d83c4eC39D9468D49',
//     ),
//   ])
//
//   const { transaction: tx3, result: result3 } = await addLiquidity({
//     chainId: cloberTestChain2.id,
//     userAddress: '0x5F79EE8f8fA862E98201120d83c4eC39D9468D49',
//     token0: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
//     token1: '0xF2e615A933825De4B39b497f6e6991418Fb31b78',
//     salt: zeroHash,
//     amount0: '0',
//     amount1: '1',
//     options: {
//       rpcUrl: publicClient.transport.url!,
//       useSubgraph: false,
//       testnetPrice: 2000,
//     },
//   })
//
//   const hash3 = await walletClient.sendTransaction({
//     ...tx3!,
//     account: '0x5F79EE8f8fA862E98201120d83c4eC39D9468D49',
//     gasPrice: tx2!.gasPrice! * 2n,
//   })
//   await publicClient.waitForTransactionReceipt({ hash: hash3 })
//   ;[afterUSDCBalance, afterWETHBalance, afterLPBalance] = await Promise.all([
//     fetchTokenBalance(
//       publicClient,
//       cloberTestChain2.id,
//       '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
//       '0x5F79EE8f8fA862E98201120d83c4eC39D9468D49',
//     ),
//     fetchTokenBalance(
//       publicClient,
//       cloberTestChain2.id,
//       '0xF2e615A933825De4B39b497f6e6991418Fb31b78',
//       '0x5F79EE8f8fA862E98201120d83c4eC39D9468D49',
//     ),
//     fetchLPBalance(
//       publicClient,
//       cloberTestChain2.id,
//       BigInt(pool.key),
//       '0x5F79EE8f8fA862E98201120d83c4eC39D9468D49',
//     ),
//   ])
//
//   expect(formatUnits(beforeUSDCBalance - afterUSDCBalance, 6)).toBe(
//     result3.currencyA.amount,
//   )
//   expect(formatUnits(beforeWETHBalance - afterWETHBalance, 18)).toBe(
//     result3.currencyB.amount,
//   )
//   expect(formatUnits(afterLPBalance - beforeLPBalance, 18)).toBe(
//     result3.lpCurrency.amount,
//   )
//
//   expect(result2.lpCurrency.amount).toBe(result3.lpCurrency.amount)
// })

// TODO: remove comment when other aggregators are ready
// test('Add liquidity two sides with swap', async () => {
//   const { publicClient, walletClient, testClient } = clients[0] as any
//
//   await setting(publicClient, walletClient, testClient)
//
//   const pool = await getPool({
//     chainId: cloberTestChain2.id,
//     token0: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
//     token1: '0xF2e615A933825De4B39b497f6e6991418Fb31b78',
//     salt: zeroHash,
//     options: {
//       rpcUrl: publicClient.transport.url!,
//       useSubgraph: false,
//     },
//   })
//
//   let [beforeUSDCBalance, beforeWETHBalance, beforeLPBalance] =
//     await Promise.all([
//       fetchTokenBalance(
//         publicClient,
//         cloberTestChain2.id,
//         '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
//         '0x5F79EE8f8fA862E98201120d83c4eC39D9468D49',
//       ),
//       fetchTokenBalance(
//         publicClient,
//         cloberTestChain2.id,
//         '0xF2e615A933825De4B39b497f6e6991418Fb31b78',
//         '0x5F79EE8f8fA862E98201120d83c4eC39D9468D49',
//       ),
//       fetchLPBalance(
//         publicClient,
//         cloberTestChain2.id,
//         BigInt(pool.key),
//         '0x5F79EE8f8fA862E98201120d83c4eC39D9468D49',
//       ),
//     ])
//
//   const { transaction: tx1, result: result1 } = await addLiquidity({
//     chainId: cloberTestChain2.id,
//     userAddress: '0x5F79EE8f8fA862E98201120d83c4eC39D9468D49',
//     token0: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
//     token1: '0xF2e615A933825De4B39b497f6e6991418Fb31b78',
//     salt: zeroHash,
//     amount0: '2000',
//     amount1: '1.0',
//     options: {
//       rpcUrl: publicClient.transport.url!,
//       useSubgraph: false,
//     },
//   })
//
//   const hash1 = await walletClient.sendTransaction({
//     ...tx1!,
//     account: '0x5F79EE8f8fA862E98201120d83c4eC39D9468D49',
//     gasPrice: tx1!.gasPrice! * 2n,
//   })
//   await publicClient.waitForTransactionReceipt({ hash: hash1 })
//   let [afterUSDCBalance, afterWETHBalance, afterLPBalance] = await Promise.all([
//     fetchTokenBalance(
//       publicClient,
//       cloberTestChain2.id,
//       '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
//       '0x5F79EE8f8fA862E98201120d83c4eC39D9468D49',
//     ),
//     fetchTokenBalance(
//       publicClient,
//       cloberTestChain2.id,
//       '0xF2e615A933825De4B39b497f6e6991418Fb31b78',
//       '0x5F79EE8f8fA862E98201120d83c4eC39D9468D49',
//     ),
//     fetchLPBalance(
//       publicClient,
//       cloberTestChain2.id,
//       BigInt(pool.key),
//       '0x5F79EE8f8fA862E98201120d83c4eC39D9468D49',
//     ),
//   ])
//   expect(formatUnits(beforeUSDCBalance - afterUSDCBalance, 6)).toBe(
//     result1.currencyA.amount,
//   )
//   expect(formatUnits(beforeWETHBalance - afterWETHBalance, 18)).toBe(
//     result1.currencyB.amount,
//   )
//   expect(formatUnits(afterLPBalance - beforeLPBalance, 18)).toBe(
//     result1.lpCurrency.amount,
//   )
//
//   // add liquidity more
//   ;[beforeUSDCBalance, beforeWETHBalance, beforeLPBalance] = await Promise.all([
//     fetchTokenBalance(
//       publicClient,
//       cloberTestChain2.id,
//       '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
//       '0x5F79EE8f8fA862E98201120d83c4eC39D9468D49',
//     ),
//     fetchTokenBalance(
//       publicClient,
//       cloberTestChain2.id,
//       '0xF2e615A933825De4B39b497f6e6991418Fb31b78',
//       '0x5F79EE8f8fA862E98201120d83c4eC39D9468D49',
//     ),
//     fetchLPBalance(
//       publicClient,
//       cloberTestChain2.id,
//       BigInt(pool.key),
//       '0x5F79EE8f8fA862E98201120d83c4eC39D9468D49',
//     ),
//   ])
//
//   const { transaction: tx2, result: result2 } = await addLiquidity({
//     chainId: cloberTestChain2.id,
//     userAddress: '0x5F79EE8f8fA862E98201120d83c4eC39D9468D49',
//     token0: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
//     token1: '0xF2e615A933825De4B39b497f6e6991418Fb31b78',
//     salt: zeroHash,
//     amount0: '2000',
//     amount1: '0.2',
//     options: {
//       rpcUrl: publicClient.transport.url!,
//       useSubgraph: false,
//       testnetPrice: 2000,
//     },
//   })
//
//   const hash2 = await walletClient.sendTransaction({
//     ...tx2!,
//     account: '0x5F79EE8f8fA862E98201120d83c4eC39D9468D49',
//     gasPrice: tx2!.gasPrice! * 2n,
//   })
//   await publicClient.waitForTransactionReceipt({ hash: hash2 })
//   ;[afterUSDCBalance, afterWETHBalance, afterLPBalance] = await Promise.all([
//     fetchTokenBalance(
//       publicClient,
//       cloberTestChain2.id,
//       '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
//       '0x5F79EE8f8fA862E98201120d83c4eC39D9468D49',
//     ),
//     fetchTokenBalance(
//       publicClient,
//       cloberTestChain2.id,
//       '0xF2e615A933825De4B39b497f6e6991418Fb31b78',
//       '0x5F79EE8f8fA862E98201120d83c4eC39D9468D49',
//     ),
//     fetchLPBalance(
//       publicClient,
//       cloberTestChain2.id,
//       BigInt(pool.key),
//       '0x5F79EE8f8fA862E98201120d83c4eC39D9468D49',
//     ),
//   ])
//
//   expect(formatUnits(beforeUSDCBalance - afterUSDCBalance, 6)).toBe(
//     result2.currencyA.amount,
//   )
//   expect(formatUnits(beforeWETHBalance - afterWETHBalance, 18)).toBe(
//     result2.currencyB.amount,
//   )
//   expect(formatUnits(afterLPBalance - beforeLPBalance, 18)).toBe(
//     result2.lpCurrency.amount,
//   )
//
//   // add liquidity more
//   ;[beforeUSDCBalance, beforeWETHBalance, beforeLPBalance] = await Promise.all([
//     fetchTokenBalance(
//       publicClient,
//       cloberTestChain2.id,
//       '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
//       '0x5F79EE8f8fA862E98201120d83c4eC39D9468D49',
//     ),
//     fetchTokenBalance(
//       publicClient,
//       cloberTestChain2.id,
//       '0xF2e615A933825De4B39b497f6e6991418Fb31b78',
//       '0x5F79EE8f8fA862E98201120d83c4eC39D9468D49',
//     ),
//     fetchLPBalance(
//       publicClient,
//       cloberTestChain2.id,
//       BigInt(pool.key),
//       '0x5F79EE8f8fA862E98201120d83c4eC39D9468D49',
//     ),
//   ])
//
//   const { transaction: tx3, result: result3 } = await addLiquidity({
//     chainId: cloberTestChain2.id,
//     userAddress: '0x5F79EE8f8fA862E98201120d83c4eC39D9468D49',
//     token0: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
//     token1: '0xF2e615A933825De4B39b497f6e6991418Fb31b78',
//     salt: zeroHash,
//     amount0: '400',
//     amount1: '1',
//     options: {
//       rpcUrl: publicClient.transport.url!,
//       useSubgraph: false,
//       testnetPrice: 2000,
//     },
//   })
//
//   const hash3 = await walletClient.sendTransaction({
//     ...tx3!,
//     account: '0x5F79EE8f8fA862E98201120d83c4eC39D9468D49',
//     gasPrice: tx3!.gasPrice! * 2n,
//   })
//   await publicClient.waitForTransactionReceipt({ hash: hash3 })
//   ;[afterUSDCBalance, afterWETHBalance, afterLPBalance] = await Promise.all([
//     fetchTokenBalance(
//       publicClient,
//       cloberTestChain2.id,
//       '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
//       '0x5F79EE8f8fA862E98201120d83c4eC39D9468D49',
//     ),
//     fetchTokenBalance(
//       publicClient,
//       cloberTestChain2.id,
//       '0xF2e615A933825De4B39b497f6e6991418Fb31b78',
//       '0x5F79EE8f8fA862E98201120d83c4eC39D9468D49',
//     ),
//     fetchLPBalance(
//       publicClient,
//       cloberTestChain2.id,
//       BigInt(pool.key),
//       '0x5F79EE8f8fA862E98201120d83c4eC39D9468D49',
//     ),
//   ])
//
//   expect(formatUnits(beforeUSDCBalance - afterUSDCBalance, 6)).toBe(
//     result3.currencyA.amount,
//   )
//   expect(formatUnits(beforeWETHBalance - afterWETHBalance, 18)).toBe(
//     result3.currencyB.amount,
//   )
//   expect(formatUnits(afterLPBalance - beforeLPBalance, 18)).toBe(
//     result3.lpCurrency.amount,
//   )
//
//   expect(result2.lpCurrency.amount).toBe(result3.lpCurrency.amount)
// })
