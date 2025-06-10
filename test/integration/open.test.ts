import { expect, test } from 'vitest'
import { zeroAddress, zeroHash } from 'viem'
import { getMarket, getPool, openMarket, openPool } from '@clober/v2-sdk'

import { setUp } from '../setup'
import { waitForTransaction } from '../utils/transaction'
import { DEV_WALLET, MOCK_USDC } from '../utils/constants'

test('try open market', async () => {
  const { publicClient, walletClient, tokenAddress } = await setUp('open')

  const beforeMarket = await getMarket({
    chainId: publicClient.chain.id,
    token0: tokenAddress,
    token1: zeroAddress,
    options: {
      rpcUrl: publicClient.transport.url!,
      useSubgraph: false,
    },
  })

  await openMarket({
    chainId: publicClient.chain.id,
    userAddress: walletClient.account.address,
    inputToken: zeroAddress,
    outputToken: tokenAddress,
    options: {
      rpcUrl: publicClient.transport.url!,
      useSubgraph: false,
    },
  }).then((transaction) =>
    waitForTransaction({
      publicClient,
      walletClient,
      transaction: transaction!,
    }),
  )

  await openMarket({
    chainId: publicClient.chain.id,
    userAddress: walletClient.account.address,
    inputToken: tokenAddress,
    outputToken: zeroAddress,
    options: {
      rpcUrl: publicClient.transport.url!,
      useSubgraph: false,
    },
  }).then((transaction) =>
    waitForTransaction({
      publicClient,
      walletClient,
      transaction: transaction!,
    }),
  )

  const afterMarket = await getMarket({
    chainId: publicClient.chain.id,
    token0: tokenAddress,
    token1: zeroAddress,
    options: {
      rpcUrl: publicClient.transport.url!,
      useSubgraph: false,
    },
  })

  expect(beforeMarket.askBook.isOpened).toEqual(false)
  expect(beforeMarket.bidBook.isOpened).toEqual(false)
  expect(afterMarket.askBook.isOpened).toEqual(true)
  expect(afterMarket.bidBook.isOpened).toEqual(true)
})

test('try already open market', async () => {
  const { publicClient, walletClient, tokenAddress } = await setUp('open')
  const transaction = await openMarket({
    chainId: publicClient.chain.id,
    userAddress: walletClient.account.address,
    inputToken: MOCK_USDC,
    outputToken: tokenAddress,
    options: {
      rpcUrl: publicClient.transport.url!,
      useSubgraph: false,
    },
  })
  expect(transaction).toBeUndefined()
})

test('try open pool', async () => {
  const { publicClient, walletClient } = await setUp('open')

  await expect(() =>
    getPool({
      chainId: publicClient.chain.id,
      token0: MOCK_USDC,
      token1: zeroAddress,
      salt: zeroHash,
      options: {
        rpcUrl: publicClient.transport.url!,
        useSubgraph: false,
      },
    }),
  ).rejects.toThrow()

  await openPool({
    chainId: publicClient.chain.id,
    userAddress: DEV_WALLET,
    tokenA: MOCK_USDC,
    tokenB: zeroAddress,
    salt: zeroHash,
    options: {
      rpcUrl: publicClient.transport.url!,
      useSubgraph: false,
    },
  }).then((transaction) =>
    waitForTransaction({
      publicClient,
      walletClient,
      transaction: transaction!,
    }),
  )

  const pool = await getPool({
    chainId: publicClient.chain.id,
    token0: MOCK_USDC,
    token1: zeroAddress,
    salt: zeroHash,
    options: {
      rpcUrl: publicClient.transport.url!,
      useSubgraph: false,
    },
  })
  expect(pool.isOpened).toEqual(true)
})
