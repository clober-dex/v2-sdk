import { expect, beforeEach, test } from 'vitest'
import { addLiquidity, getPool } from '@clober/v2-sdk'
import { formatUnits, zeroHash } from 'viem'

import { cloberTestChain } from '../src/constants/test-chain'

import { account, FORK_URL } from './utils/constants'
import { createProxyClients } from './utils/utils'
import { fetchLPBalance, fetchTokenBalance } from './utils/currency'

const clients = createProxyClients(
  Array.from({ length: 2 }, () => Math.floor(new Date().getTime())).map(
    (id) => id,
  ),
)

beforeEach(async () => {
  await Promise.all(
    clients.map(({ testClient }) => {
      return testClient.reset({
        jsonRpcUrl: FORK_URL,
        blockNumber: 83907945n,
      })
    }),
  )
})

test('Add liquidity without swap - 1', async () => {
  const { publicClient, walletClient } = clients[0] as any

  const pool = await getPool({
    chainId: cloberTestChain.id,
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
        cloberTestChain.id,
        '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
        account.address,
      ),
      fetchTokenBalance(
        publicClient,
        cloberTestChain.id,
        '0xF2e615A933825De4B39b497f6e6991418Fb31b78',
        account.address,
      ),
      fetchLPBalance(
        publicClient,
        cloberTestChain.id,
        BigInt(pool.key),
        account.address,
      ),
    ])

  const { transaction: tx1, result: result1 } = await addLiquidity({
    chainId: cloberTestChain.id,
    userAddress: account.address,
    token0: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    token1: '0xF2e615A933825De4B39b497f6e6991418Fb31b78',
    salt: zeroHash,
    amount0: '2000',
    amount1: '1.0',
    options: {
      rpcUrl: publicClient.transport.url!,
      useSubgraph: false,
    },
  })

  const hash1 = await walletClient.sendTransaction({
    ...tx1!,
    account,
    gasPrice: tx1!.gasPrice! * 2n,
  })
  await publicClient.waitForTransactionReceipt({ hash: hash1 })
  let [afterUSDCBalance, afterWETHBalance, afterLPBalance] = await Promise.all([
    fetchTokenBalance(
      publicClient,
      cloberTestChain.id,
      '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
      account.address,
    ),
    fetchTokenBalance(
      publicClient,
      cloberTestChain.id,
      '0xF2e615A933825De4B39b497f6e6991418Fb31b78',
      account.address,
    ),
    fetchLPBalance(
      publicClient,
      cloberTestChain.id,
      BigInt(pool.key),
      account.address,
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
      cloberTestChain.id,
      '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
      account.address,
    ),
    fetchTokenBalance(
      publicClient,
      cloberTestChain.id,
      '0xF2e615A933825De4B39b497f6e6991418Fb31b78',
      account.address,
    ),
    fetchLPBalance(
      publicClient,
      cloberTestChain.id,
      BigInt(pool.key),
      account.address,
    ),
  ])

  const { transaction: tx2, result: result2 } = await addLiquidity({
    chainId: cloberTestChain.id,
    userAddress: account.address,
    token0: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    token1: '0xF2e615A933825De4B39b497f6e6991418Fb31b78',
    salt: zeroHash,
    amount0: '2000',
    amount1: '0.7',
    options: {
      rpcUrl: publicClient.transport.url!,
      useSubgraph: false,
    },
  })

  const hash2 = await walletClient.sendTransaction({
    ...tx2!,
    account,
    gasPrice: tx2!.gasPrice! * 2n,
  })
  await publicClient.waitForTransactionReceipt({ hash: hash2 })
  ;[afterUSDCBalance, afterWETHBalance, afterLPBalance] = await Promise.all([
    fetchTokenBalance(
      publicClient,
      cloberTestChain.id,
      '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
      account.address,
    ),
    fetchTokenBalance(
      publicClient,
      cloberTestChain.id,
      '0xF2e615A933825De4B39b497f6e6991418Fb31b78',
      account.address,
    ),
    fetchLPBalance(
      publicClient,
      cloberTestChain.id,
      BigInt(pool.key),
      account.address,
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
  const { publicClient, walletClient } = clients[0] as any

  const pool = await getPool({
    chainId: cloberTestChain.id,
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
        cloberTestChain.id,
        '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
        account.address,
      ),
      fetchTokenBalance(
        publicClient,
        cloberTestChain.id,
        '0xF2e615A933825De4B39b497f6e6991418Fb31b78',
        account.address,
      ),
      fetchLPBalance(
        publicClient,
        cloberTestChain.id,
        BigInt(pool.key),
        account.address,
      ),
    ])

  const { transaction: tx1, result: result1 } = await addLiquidity({
    chainId: cloberTestChain.id,
    userAddress: account.address,
    token0: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    token1: '0xF2e615A933825De4B39b497f6e6991418Fb31b78',
    salt: zeroHash,
    amount0: '2000',
    amount1: '0.7',
    options: {
      rpcUrl: publicClient.transport.url!,
      useSubgraph: false,
    },
  })

  const hash1 = await walletClient.sendTransaction({
    ...tx1!,
    account,
    gasPrice: tx1!.gasPrice! * 2n,
  })
  await publicClient.waitForTransactionReceipt({ hash: hash1 })
  let [afterUSDCBalance, afterWETHBalance, afterLPBalance] = await Promise.all([
    fetchTokenBalance(
      publicClient,
      cloberTestChain.id,
      '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
      account.address,
    ),
    fetchTokenBalance(
      publicClient,
      cloberTestChain.id,
      '0xF2e615A933825De4B39b497f6e6991418Fb31b78',
      account.address,
    ),
    fetchLPBalance(
      publicClient,
      cloberTestChain.id,
      BigInt(pool.key),
      account.address,
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
      cloberTestChain.id,
      '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
      account.address,
    ),
    fetchTokenBalance(
      publicClient,
      cloberTestChain.id,
      '0xF2e615A933825De4B39b497f6e6991418Fb31b78',
      account.address,
    ),
    fetchLPBalance(
      publicClient,
      cloberTestChain.id,
      BigInt(pool.key),
      account.address,
    ),
  ])

  const { transaction: tx2, result: result2 } = await addLiquidity({
    chainId: cloberTestChain.id,
    userAddress: account.address,
    token0: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    token1: '0xF2e615A933825De4B39b497f6e6991418Fb31b78',
    salt: zeroHash,
    amount0: '2000',
    amount1: '1.0',
    options: {
      rpcUrl: publicClient.transport.url!,
      useSubgraph: false,
    },
  })

  const hash2 = await walletClient.sendTransaction({
    ...tx2!,
    account,
    gasPrice: tx2!.gasPrice! * 2n,
  })
  await publicClient.waitForTransactionReceipt({ hash: hash2 })
  ;[afterUSDCBalance, afterWETHBalance, afterLPBalance] = await Promise.all([
    fetchTokenBalance(
      publicClient,
      cloberTestChain.id,
      '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
      account.address,
    ),
    fetchTokenBalance(
      publicClient,
      cloberTestChain.id,
      '0xF2e615A933825De4B39b497f6e6991418Fb31b78',
      account.address,
    ),
    fetchLPBalance(
      publicClient,
      cloberTestChain.id,
      BigInt(pool.key),
      account.address,
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

test('Add liquidity one side with swap', async () => {
  const { publicClient, walletClient } = clients[0] as any

  const pool = await getPool({
    chainId: cloberTestChain.id,
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
        cloberTestChain.id,
        '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
        account.address,
      ),
      fetchTokenBalance(
        publicClient,
        cloberTestChain.id,
        '0xF2e615A933825De4B39b497f6e6991418Fb31b78',
        account.address,
      ),
      fetchLPBalance(
        publicClient,
        cloberTestChain.id,
        BigInt(pool.key),
        account.address,
      ),
    ])

  const { transaction: tx1, result: result1 } = await addLiquidity({
    chainId: cloberTestChain.id,
    userAddress: account.address,
    token0: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    token1: '0xF2e615A933825De4B39b497f6e6991418Fb31b78',
    salt: zeroHash,
    amount0: '2000',
    amount1: '1.0',
    options: {
      rpcUrl: publicClient.transport.url!,
      useSubgraph: false,
    },
  })

  const hash1 = await walletClient.sendTransaction({
    ...tx1!,
    account,
    gasPrice: tx1!.gasPrice! * 2n,
  })
  await publicClient.waitForTransactionReceipt({ hash: hash1 })
  let [afterUSDCBalance, afterWETHBalance, afterLPBalance] = await Promise.all([
    fetchTokenBalance(
      publicClient,
      cloberTestChain.id,
      '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
      account.address,
    ),
    fetchTokenBalance(
      publicClient,
      cloberTestChain.id,
      '0xF2e615A933825De4B39b497f6e6991418Fb31b78',
      account.address,
    ),
    fetchLPBalance(
      publicClient,
      cloberTestChain.id,
      BigInt(pool.key),
      account.address,
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
      cloberTestChain.id,
      '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
      account.address,
    ),
    fetchTokenBalance(
      publicClient,
      cloberTestChain.id,
      '0xF2e615A933825De4B39b497f6e6991418Fb31b78',
      account.address,
    ),
    fetchLPBalance(
      publicClient,
      cloberTestChain.id,
      BigInt(pool.key),
      account.address,
    ),
  ])

  const { transaction: tx2, result: result2 } = await addLiquidity({
    chainId: cloberTestChain.id,
    userAddress: account.address,
    token0: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    token1: '0xF2e615A933825De4B39b497f6e6991418Fb31b78',
    salt: zeroHash,
    amount0: '2000',
    amount1: '0',
    options: {
      rpcUrl: publicClient.transport.url!,
      useSubgraph: false,
    },
  })

  const hash2 = await walletClient.sendTransaction({
    ...tx2!,
    account,
    gasPrice: tx2!.gasPrice! * 2n,
  })
  await publicClient.waitForTransactionReceipt({ hash: hash2 })
  ;[afterUSDCBalance, afterWETHBalance, afterLPBalance] = await Promise.all([
    fetchTokenBalance(
      publicClient,
      cloberTestChain.id,
      '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
      account.address,
    ),
    fetchTokenBalance(
      publicClient,
      cloberTestChain.id,
      '0xF2e615A933825De4B39b497f6e6991418Fb31b78',
      account.address,
    ),
    fetchLPBalance(
      publicClient,
      cloberTestChain.id,
      BigInt(pool.key),
      account.address,
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

  // add liquidity more
  ;[beforeUSDCBalance, beforeWETHBalance, beforeLPBalance] = await Promise.all([
    fetchTokenBalance(
      publicClient,
      cloberTestChain.id,
      '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
      account.address,
    ),
    fetchTokenBalance(
      publicClient,
      cloberTestChain.id,
      '0xF2e615A933825De4B39b497f6e6991418Fb31b78',
      account.address,
    ),
    fetchLPBalance(
      publicClient,
      cloberTestChain.id,
      BigInt(pool.key),
      account.address,
    ),
  ])

  const { transaction: tx3, result: result3 } = await addLiquidity({
    chainId: cloberTestChain.id,
    userAddress: account.address,
    token0: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    token1: '0xF2e615A933825De4B39b497f6e6991418Fb31b78',
    salt: zeroHash,
    amount0: '0',
    amount1: '1',
    options: {
      rpcUrl: publicClient.transport.url!,
      useSubgraph: false,
    },
  })

  const hash3 = await walletClient.sendTransaction({
    ...tx3!,
    account,
    gasPrice: tx2!.gasPrice! * 2n,
  })
  await publicClient.waitForTransactionReceipt({ hash: hash3 })
  ;[afterUSDCBalance, afterWETHBalance, afterLPBalance] = await Promise.all([
    fetchTokenBalance(
      publicClient,
      cloberTestChain.id,
      '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
      account.address,
    ),
    fetchTokenBalance(
      publicClient,
      cloberTestChain.id,
      '0xF2e615A933825De4B39b497f6e6991418Fb31b78',
      account.address,
    ),
    fetchLPBalance(
      publicClient,
      cloberTestChain.id,
      BigInt(pool.key),
      account.address,
    ),
  ])

  expect(formatUnits(beforeUSDCBalance - afterUSDCBalance, 6)).toBe(
    result3.currencyA.amount,
  )
  expect(formatUnits(beforeWETHBalance - afterWETHBalance, 18)).toBe(
    result3.currencyB.amount,
  )
  expect(formatUnits(afterLPBalance - beforeLPBalance, 18)).toBe(
    result3.lpCurrency.amount,
  )

  expect(result2.lpCurrency.amount).toBe(result3.lpCurrency.amount)
})

test('Add liquidity two sides with swap', async () => {
  const { publicClient, walletClient } = clients[0] as any

  const pool = await getPool({
    chainId: cloberTestChain.id,
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
        cloberTestChain.id,
        '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
        account.address,
      ),
      fetchTokenBalance(
        publicClient,
        cloberTestChain.id,
        '0xF2e615A933825De4B39b497f6e6991418Fb31b78',
        account.address,
      ),
      fetchLPBalance(
        publicClient,
        cloberTestChain.id,
        BigInt(pool.key),
        account.address,
      ),
    ])

  const { transaction: tx1, result: result1 } = await addLiquidity({
    chainId: cloberTestChain.id,
    userAddress: account.address,
    token0: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    token1: '0xF2e615A933825De4B39b497f6e6991418Fb31b78',
    salt: zeroHash,
    amount0: '2000',
    amount1: '1.0',
    options: {
      rpcUrl: publicClient.transport.url!,
      useSubgraph: false,
    },
  })

  const hash1 = await walletClient.sendTransaction({
    ...tx1!,
    account,
    gasPrice: tx1!.gasPrice! * 2n,
  })
  await publicClient.waitForTransactionReceipt({ hash: hash1 })
  let [afterUSDCBalance, afterWETHBalance, afterLPBalance] = await Promise.all([
    fetchTokenBalance(
      publicClient,
      cloberTestChain.id,
      '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
      account.address,
    ),
    fetchTokenBalance(
      publicClient,
      cloberTestChain.id,
      '0xF2e615A933825De4B39b497f6e6991418Fb31b78',
      account.address,
    ),
    fetchLPBalance(
      publicClient,
      cloberTestChain.id,
      BigInt(pool.key),
      account.address,
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
      cloberTestChain.id,
      '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
      account.address,
    ),
    fetchTokenBalance(
      publicClient,
      cloberTestChain.id,
      '0xF2e615A933825De4B39b497f6e6991418Fb31b78',
      account.address,
    ),
    fetchLPBalance(
      publicClient,
      cloberTestChain.id,
      BigInt(pool.key),
      account.address,
    ),
  ])

  const { transaction: tx2, result: result2 } = await addLiquidity({
    chainId: cloberTestChain.id,
    userAddress: account.address,
    token0: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    token1: '0xF2e615A933825De4B39b497f6e6991418Fb31b78',
    salt: zeroHash,
    amount0: '2000',
    amount1: '0.2',
    options: {
      rpcUrl: publicClient.transport.url!,
      useSubgraph: false,
    },
  })

  const hash2 = await walletClient.sendTransaction({
    ...tx2!,
    account,
    gasPrice: tx2!.gasPrice! * 2n,
  })
  await publicClient.waitForTransactionReceipt({ hash: hash2 })
  ;[afterUSDCBalance, afterWETHBalance, afterLPBalance] = await Promise.all([
    fetchTokenBalance(
      publicClient,
      cloberTestChain.id,
      '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
      account.address,
    ),
    fetchTokenBalance(
      publicClient,
      cloberTestChain.id,
      '0xF2e615A933825De4B39b497f6e6991418Fb31b78',
      account.address,
    ),
    fetchLPBalance(
      publicClient,
      cloberTestChain.id,
      BigInt(pool.key),
      account.address,
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

  // add liquidity more
  ;[beforeUSDCBalance, beforeWETHBalance, beforeLPBalance] = await Promise.all([
    fetchTokenBalance(
      publicClient,
      cloberTestChain.id,
      '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
      account.address,
    ),
    fetchTokenBalance(
      publicClient,
      cloberTestChain.id,
      '0xF2e615A933825De4B39b497f6e6991418Fb31b78',
      account.address,
    ),
    fetchLPBalance(
      publicClient,
      cloberTestChain.id,
      BigInt(pool.key),
      account.address,
    ),
  ])

  const { transaction: tx3, result: result3 } = await addLiquidity({
    chainId: cloberTestChain.id,
    userAddress: account.address,
    token0: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    token1: '0xF2e615A933825De4B39b497f6e6991418Fb31b78',
    salt: zeroHash,
    amount0: '400',
    amount1: '1',
    options: {
      rpcUrl: publicClient.transport.url!,
      useSubgraph: false,
    },
  })

  const hash3 = await walletClient.sendTransaction({
    ...tx3!,
    account,
    gasPrice: tx3!.gasPrice! * 2n,
  })
  await publicClient.waitForTransactionReceipt({ hash: hash3 })
  ;[afterUSDCBalance, afterWETHBalance, afterLPBalance] = await Promise.all([
    fetchTokenBalance(
      publicClient,
      cloberTestChain.id,
      '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
      account.address,
    ),
    fetchTokenBalance(
      publicClient,
      cloberTestChain.id,
      '0xF2e615A933825De4B39b497f6e6991418Fb31b78',
      account.address,
    ),
    fetchLPBalance(
      publicClient,
      cloberTestChain.id,
      BigInt(pool.key),
      account.address,
    ),
  ])

  expect(formatUnits(beforeUSDCBalance - afterUSDCBalance, 6)).toBe(
    result3.currencyA.amount,
  )
  expect(formatUnits(beforeWETHBalance - afterWETHBalance, 18)).toBe(
    result3.currencyB.amount,
  )
  expect(formatUnits(afterLPBalance - beforeLPBalance, 18)).toBe(
    result3.lpCurrency.amount,
  )

  expect(result2.lpCurrency.amount).toBe(result3.lpCurrency.amount)
})
