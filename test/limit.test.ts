import { expect, test } from 'vitest'
import { getMarket, limitOrder } from '@clober/v2-sdk'

import { setUp } from './setup'
import { MOCK_USDC } from './constants'
import { waitForTransaction } from './utils/transaction'
import { getTokenBalance } from './utils/currency'

test('make bid order', async () => {
  const { publicClient, walletClient, tokenAddress, market } = await setUp()

  const {
    transaction,
    result: { make, taken, spent },
  } = await limitOrder({
    chainId: publicClient.chain.id,
    userAddress: walletClient.account.address,
    inputToken: MOCK_USDC,
    outputToken: tokenAddress,
    amount: '1000',
    price: '0.01',
    options: {
      rpcUrl: publicClient.transport.url!,
      postOnly: true,
      useSubgraph: false,
    },
  })
  const [beforeUSDCBalance, beforeMarket] = await Promise.all([
    getTokenBalance({
      publicClient,
      userAddress: walletClient.account.address,
      tokenAddress: MOCK_USDC,
    }),
    getMarket({
      chainId: publicClient.chain.id,
      token0: tokenAddress,
      token1: MOCK_USDC,
      options: {
        rpcUrl: publicClient.transport.url!,
        useSubgraph: false,
      },
    }),
  ])
  expect(beforeMarket.bids.length).toEqual(0)
  await waitForTransaction({ transaction, publicClient, walletClient })

  const [afterUSDCBalance, afterMarket] = await Promise.all([
    getTokenBalance({
      publicClient,
      userAddress: walletClient.account.address,
      tokenAddress: MOCK_USDC,
    }),
    getMarket({
      chainId: publicClient.chain.id,
      token0: tokenAddress,
      token1: MOCK_USDC,
      options: {
        rpcUrl: publicClient.transport.url!,
        useSubgraph: false,
      },
    }),
  ])
  expect(beforeUSDCBalance - afterUSDCBalance).toEqual(1000000000n)
  expect(afterMarket.bids.length).toEqual(1)
  expect(afterMarket.bids[0].price).toEqual(
    '0.009999030941607050990746193040618222487776224627342713802136131562292575836181640625',
  )
  expect(afterMarket.bids[0].baseAmount).toEqual('100039.703431423835106822')

  expect(make.amount).toEqual('1000')
  expect(make.currency.address).toEqual(MOCK_USDC)
  expect(make.price).toEqual(
    '0.009999030941607050990746193040618222487776224627342713802136131562292575836181640625',
  )

  expect(spent.amount).toEqual('0')
  expect(spent.currency.address).toEqual(MOCK_USDC)

  expect(taken.amount).toEqual('0')
  expect(taken.currency.address).toEqual(tokenAddress)
})
