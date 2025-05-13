import { beforeEach, expect, test } from 'vitest'
import { addLiquidity, getPool, openPool } from '@clober/v2-sdk'
import { formatUnits, zeroHash } from 'viem'

import { cloberTestChain2 } from '../src/constants/test-chain'
import { CONTRACT_ADDRESSES } from '../src/constants/addresses'

import { FORK_URL } from './utils/constants'
import { createProxyClients2 } from './utils/utils'
import { fetchLPBalance, fetchTokenBalance } from './utils/currency'

const clients = createProxyClients2(
  Array.from({ length: 2 }, () => Math.floor(new Date().getTime())).map(
    (id) => id,
  ),
)

beforeEach(async () => {
  await Promise.all(
    clients.map(({ testClient }) => {
      return testClient.reset({
        jsonRpcUrl: FORK_URL,
        blockNumber: 91501200n,
      })
    }),
  )
})

const setting = async (
  publicClient: any,
  walletClient: any,
  testClient: any,
) => {
  await testClient.impersonateAccount({
    address: '0x5F79EE8f8fA862E98201120d83c4eC39D9468D49',
  })

  const openPoolTx = await openPool({
    chainId: cloberTestChain2.id,
    userAddress: '0x5F79EE8f8fA862E98201120d83c4eC39D9468D49',
    tokenA: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    tokenB: '0xF2e615A933825De4B39b497f6e6991418Fb31b78',
    salt: zeroHash,
    options: {
      rpcUrl: publicClient.transport.url!,
      useSubgraph: false,
    },
  })
  const openPoolHash = await walletClient.sendTransaction({
    ...openPoolTx!,
    account: '0x5F79EE8f8fA862E98201120d83c4eC39D9468D49',
    gasPrice: openPoolTx!.gasPrice! * 2n,
  })
  await publicClient.waitForTransactionReceipt({ hash: openPoolHash })

  const approveMintHash1 = await walletClient.writeContract({
    account: '0x5F79EE8f8fA862E98201120d83c4eC39D9468D49',
    chain: cloberTestChain2,
    address: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
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
    args: [CONTRACT_ADDRESSES[cloberTestChain2.id]!.Minter, 2n ** 256n - 1n],
  })
  const approveMintReceipt1 = await publicClient.waitForTransactionReceipt({
    hash: approveMintHash1!,
  })
  expect(approveMintReceipt1.status).toEqual('success')
  const approveMintHash2 = await walletClient.writeContract({
    account: '0x5F79EE8f8fA862E98201120d83c4eC39D9468D49',
    chain: cloberTestChain2,
    address: '0xF2e615A933825De4B39b497f6e6991418Fb31b78',
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
    args: [CONTRACT_ADDRESSES[cloberTestChain2.id]!.Minter, 2n ** 256n - 1n],
  })
  const approveMintReceipt2 = await publicClient.waitForTransactionReceipt({
    hash: approveMintHash2!,
  })
  expect(approveMintReceipt2.status).toEqual('success')
}

test('Add liquidity without swap - 1', async () => {
  const { publicClient, walletClient, testClient } = clients[0] as any

  await setting(publicClient, walletClient, testClient)

  const pool = await getPool({
    chainId: cloberTestChain2.id,
    token0: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    token1: '0xF2e615A933825De4B39b497f6e6991418Fb31b78',
    salt: zeroHash,
    options: {
      rpcUrl: publicClient.transport.url!,
      useSubgraph: false,
    },
  })

  let [beforeUSDCBalance, beforeWETHBalance, beforeLPBalance] =
    await Promise.all([
      fetchTokenBalance(
        publicClient,
        cloberTestChain2.id,
        '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
        '0x5F79EE8f8fA862E98201120d83c4eC39D9468D49',
      ),
      fetchTokenBalance(
        publicClient,
        cloberTestChain2.id,
        '0xF2e615A933825De4B39b497f6e6991418Fb31b78',
        '0x5F79EE8f8fA862E98201120d83c4eC39D9468D49',
      ),
      fetchLPBalance(
        publicClient,
        cloberTestChain2.id,
        BigInt(pool.key),
        '0x5F79EE8f8fA862E98201120d83c4eC39D9468D49',
      ),
    ])

  const { transaction: tx1, result: result1 } = await addLiquidity({
    chainId: cloberTestChain2.id,
    userAddress: '0x5F79EE8f8fA862E98201120d83c4eC39D9468D49',
    token0: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    token1: '0xF2e615A933825De4B39b497f6e6991418Fb31b78',
    salt: zeroHash,
    amount0: '2000',
    amount1: '1.0',
    options: {
      rpcUrl: publicClient.transport.url!,
      useSubgraph: false,
      disableSwap: true,
    },
  })

  const hash1 = await walletClient.sendTransaction({
    ...tx1!,
    account: '0x5F79EE8f8fA862E98201120d83c4eC39D9468D49',
    gasPrice: tx1!.gasPrice! * 2n,
  })
  await publicClient.waitForTransactionReceipt({ hash: hash1 })
  let [afterUSDCBalance, afterWETHBalance, afterLPBalance] = await Promise.all([
    fetchTokenBalance(
      publicClient,
      cloberTestChain2.id,
      '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
      '0x5F79EE8f8fA862E98201120d83c4eC39D9468D49',
    ),
    fetchTokenBalance(
      publicClient,
      cloberTestChain2.id,
      '0xF2e615A933825De4B39b497f6e6991418Fb31b78',
      '0x5F79EE8f8fA862E98201120d83c4eC39D9468D49',
    ),
    fetchLPBalance(
      publicClient,
      cloberTestChain2.id,
      BigInt(pool.key),
      '0x5F79EE8f8fA862E98201120d83c4eC39D9468D49',
    ),
  ])
  expect(formatUnits(beforeUSDCBalance - afterUSDCBalance, 6)).toBe(
    result1.currencyA.amount,
  )
  expect(formatUnits(beforeWETHBalance - afterWETHBalance, 18)).toBe(
    result1.currencyB.amount,
  )
  expect(formatUnits(afterLPBalance - beforeLPBalance, 18)).toBe(
    result1.lpCurrency.amount,
  )

  // add liquidity more
  ;[beforeUSDCBalance, beforeWETHBalance, beforeLPBalance] = await Promise.all([
    fetchTokenBalance(
      publicClient,
      cloberTestChain2.id,
      '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
      '0x5F79EE8f8fA862E98201120d83c4eC39D9468D49',
    ),
    fetchTokenBalance(
      publicClient,
      cloberTestChain2.id,
      '0xF2e615A933825De4B39b497f6e6991418Fb31b78',
      '0x5F79EE8f8fA862E98201120d83c4eC39D9468D49',
    ),
    fetchLPBalance(
      publicClient,
      cloberTestChain2.id,
      BigInt(pool.key),
      '0x5F79EE8f8fA862E98201120d83c4eC39D9468D49',
    ),
  ])

  const { transaction: tx2, result: result2 } = await addLiquidity({
    chainId: cloberTestChain2.id,
    userAddress: '0x5F79EE8f8fA862E98201120d83c4eC39D9468D49',
    token0: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    token1: '0xF2e615A933825De4B39b497f6e6991418Fb31b78',
    salt: zeroHash,
    amount0: '2000',
    amount1: '0.7',
    options: {
      rpcUrl: publicClient.transport.url!,
      useSubgraph: false,
      disableSwap: true,
    },
  })

  const hash2 = await walletClient.sendTransaction({
    ...tx2!,
    account: '0x5F79EE8f8fA862E98201120d83c4eC39D9468D49',
    gasPrice: tx2!.gasPrice! * 2n,
  })
  await publicClient.waitForTransactionReceipt({ hash: hash2 })
  ;[afterUSDCBalance, afterWETHBalance, afterLPBalance] = await Promise.all([
    fetchTokenBalance(
      publicClient,
      cloberTestChain2.id,
      '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
      '0x5F79EE8f8fA862E98201120d83c4eC39D9468D49',
    ),
    fetchTokenBalance(
      publicClient,
      cloberTestChain2.id,
      '0xF2e615A933825De4B39b497f6e6991418Fb31b78',
      '0x5F79EE8f8fA862E98201120d83c4eC39D9468D49',
    ),
    fetchLPBalance(
      publicClient,
      cloberTestChain2.id,
      BigInt(pool.key),
      '0x5F79EE8f8fA862E98201120d83c4eC39D9468D49',
    ),
  ])

  expect(formatUnits(beforeUSDCBalance - afterUSDCBalance, 6)).toBe(
    result2.currencyA.amount,
  )
  expect(formatUnits(beforeWETHBalance - afterWETHBalance, 18)).toBe(
    result2.currencyB.amount,
  )
  expect(formatUnits(afterLPBalance - beforeLPBalance, 18)).toBe(
    result2.lpCurrency.amount,
  )
})

test('Add liquidity without swap - 2', async () => {
  const { publicClient, walletClient, testClient } = clients[0] as any

  await setting(publicClient, walletClient, testClient)

  const pool = await getPool({
    chainId: cloberTestChain2.id,
    token0: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    token1: '0xF2e615A933825De4B39b497f6e6991418Fb31b78',
    salt: zeroHash,
    options: {
      rpcUrl: publicClient.transport.url!,
      useSubgraph: false,
    },
  })

  let [beforeUSDCBalance, beforeWETHBalance, beforeLPBalance] =
    await Promise.all([
      fetchTokenBalance(
        publicClient,
        cloberTestChain2.id,
        '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
        '0x5F79EE8f8fA862E98201120d83c4eC39D9468D49',
      ),
      fetchTokenBalance(
        publicClient,
        cloberTestChain2.id,
        '0xF2e615A933825De4B39b497f6e6991418Fb31b78',
        '0x5F79EE8f8fA862E98201120d83c4eC39D9468D49',
      ),
      fetchLPBalance(
        publicClient,
        cloberTestChain2.id,
        BigInt(pool.key),
        '0x5F79EE8f8fA862E98201120d83c4eC39D9468D49',
      ),
    ])

  const { transaction: tx1, result: result1 } = await addLiquidity({
    chainId: cloberTestChain2.id,
    userAddress: '0x5F79EE8f8fA862E98201120d83c4eC39D9468D49',
    token0: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    token1: '0xF2e615A933825De4B39b497f6e6991418Fb31b78',
    salt: zeroHash,
    amount0: '2000',
    amount1: '0.7',
    options: {
      rpcUrl: publicClient.transport.url!,
      useSubgraph: false,
      disableSwap: true,
    },
  })

  const hash1 = await walletClient.sendTransaction({
    ...tx1!,
    account: '0x5F79EE8f8fA862E98201120d83c4eC39D9468D49',
    gasPrice: tx1!.gasPrice! * 2n,
  })
  await publicClient.waitForTransactionReceipt({ hash: hash1 })
  let [afterUSDCBalance, afterWETHBalance, afterLPBalance] = await Promise.all([
    fetchTokenBalance(
      publicClient,
      cloberTestChain2.id,
      '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
      '0x5F79EE8f8fA862E98201120d83c4eC39D9468D49',
    ),
    fetchTokenBalance(
      publicClient,
      cloberTestChain2.id,
      '0xF2e615A933825De4B39b497f6e6991418Fb31b78',
      '0x5F79EE8f8fA862E98201120d83c4eC39D9468D49',
    ),
    fetchLPBalance(
      publicClient,
      cloberTestChain2.id,
      BigInt(pool.key),
      '0x5F79EE8f8fA862E98201120d83c4eC39D9468D49',
    ),
  ])
  expect(formatUnits(beforeUSDCBalance - afterUSDCBalance, 6)).toBe(
    result1.currencyA.amount,
  )
  expect(formatUnits(beforeWETHBalance - afterWETHBalance, 18)).toBe(
    result1.currencyB.amount,
  )
  expect(formatUnits(afterLPBalance - beforeLPBalance, 18)).toBe(
    result1.lpCurrency.amount,
  )

  // add liquidity more
  ;[beforeUSDCBalance, beforeWETHBalance, beforeLPBalance] = await Promise.all([
    fetchTokenBalance(
      publicClient,
      cloberTestChain2.id,
      '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
      '0x5F79EE8f8fA862E98201120d83c4eC39D9468D49',
    ),
    fetchTokenBalance(
      publicClient,
      cloberTestChain2.id,
      '0xF2e615A933825De4B39b497f6e6991418Fb31b78',
      '0x5F79EE8f8fA862E98201120d83c4eC39D9468D49',
    ),
    fetchLPBalance(
      publicClient,
      cloberTestChain2.id,
      BigInt(pool.key),
      '0x5F79EE8f8fA862E98201120d83c4eC39D9468D49',
    ),
  ])

  const { transaction: tx2, result: result2 } = await addLiquidity({
    chainId: cloberTestChain2.id,
    userAddress: '0x5F79EE8f8fA862E98201120d83c4eC39D9468D49',
    token0: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    token1: '0xF2e615A933825De4B39b497f6e6991418Fb31b78',
    salt: zeroHash,
    amount0: '2000',
    amount1: '1.0',
    options: {
      rpcUrl: publicClient.transport.url!,
      useSubgraph: false,
      disableSwap: true,
    },
  })

  const hash2 = await walletClient.sendTransaction({
    ...tx2!,
    account: '0x5F79EE8f8fA862E98201120d83c4eC39D9468D49',
    gasPrice: tx2!.gasPrice! * 2n,
  })
  await publicClient.waitForTransactionReceipt({ hash: hash2 })
  ;[afterUSDCBalance, afterWETHBalance, afterLPBalance] = await Promise.all([
    fetchTokenBalance(
      publicClient,
      cloberTestChain2.id,
      '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
      '0x5F79EE8f8fA862E98201120d83c4eC39D9468D49',
    ),
    fetchTokenBalance(
      publicClient,
      cloberTestChain2.id,
      '0xF2e615A933825De4B39b497f6e6991418Fb31b78',
      '0x5F79EE8f8fA862E98201120d83c4eC39D9468D49',
    ),
    fetchLPBalance(
      publicClient,
      cloberTestChain2.id,
      BigInt(pool.key),
      '0x5F79EE8f8fA862E98201120d83c4eC39D9468D49',
    ),
  ])

  expect(formatUnits(beforeUSDCBalance - afterUSDCBalance, 6)).toBe(
    result2.currencyA.amount,
  )
  expect(formatUnits(beforeWETHBalance - afterWETHBalance, 18)).toBe(
    result2.currencyB.amount,
  )
  expect(formatUnits(afterLPBalance - beforeLPBalance, 18)).toBe(
    result2.lpCurrency.amount,
  )
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
