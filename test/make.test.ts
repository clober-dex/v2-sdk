import { expect, test } from 'vitest'
import { getMarket, limitOrder } from '@clober/v2-sdk'

import { setUp } from './setup'
import { MOCK_USDC } from './constants'
import { waitForTransaction } from './utils/transaction'
import { getTokenBalance } from './utils/currency'

test('make at exactly price', async () => {
  const { publicClient, walletClient, tokenAddress } = await setUp('make')

  const {
    transaction,
    result: { make, taken, spent },
  } = await limitOrder({
    chainId: publicClient.chain.id,
    userAddress: walletClient.account.address,
    inputToken: MOCK_USDC,
    outputToken: tokenAddress,
    amount: '1000',
    price:
      '0.009999030941607050990746193040618222487776224627342713802136131562292575836181640625',
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

test('make at approximate price', async () => {
  const { publicClient, walletClient, tokenAddress } = await setUp('make')

  const {
    transaction,
    result: { make, taken, spent },
  } = await limitOrder({
    chainId: publicClient.chain.id,
    userAddress: walletClient.account.address,
    inputToken: MOCK_USDC,
    outputToken: tokenAddress,
    amount: '1000',
    price: '0.0099990309416070',
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
    '0.009998031138493205728073882109292020323675596882306848556254408322274684906005859375',
  )
  expect(afterMarket.bids[0].baseAmount).toEqual('100049.707401766936887222')

  expect(make.amount).toEqual('1000')
  expect(make.currency.address).toEqual(MOCK_USDC)
  expect(make.price).toEqual(
    '0.009998031138493205728073882109292020323675596882306848556254408322274684906005859375',
  )

  expect(spent.amount).toEqual('0')
  expect(spent.currency.address).toEqual(MOCK_USDC)

  expect(taken.amount).toEqual('0')
  expect(taken.currency.address).toEqual(tokenAddress)
})

test('make bid at 0.01', async () => {
  const { publicClient, walletClient, tokenAddress } = await setUp('make')

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

test('make bid at 0.01 with rounding up', async () => {
  const { publicClient, walletClient, tokenAddress } = await setUp('make')

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
      roundingUpMakeBid: true,
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
    '0.0100000308447012157335509249431491091294164907932184860328561626374721527099609375',
  )
  expect(afterMarket.bids[0].baseAmount).toEqual('100029.700461377656948164')

  expect(make.amount).toEqual('1000')
  expect(make.currency.address).toEqual(MOCK_USDC)
  expect(make.price).toEqual(
    '0.0100000308447012157335509249431491091294164907932184860328561626374721527099609375',
  )

  expect(spent.amount).toEqual('0')
  expect(spent.currency.address).toEqual(MOCK_USDC)

  expect(taken.amount).toEqual('0')
  expect(taken.currency.address).toEqual(tokenAddress)
})

test('make ask at 0.01', async () => {
  const { publicClient, walletClient, tokenAddress } = await setUp('make')

  const {
    transaction,
    result: { make, taken, spent },
  } = await limitOrder({
    chainId: publicClient.chain.id,
    userAddress: walletClient.account.address,
    inputToken: tokenAddress,
    outputToken: MOCK_USDC,
    amount: '1000',
    price: '0.01',
    options: {
      rpcUrl: publicClient.transport.url!,
      postOnly: true,
      useSubgraph: false,
    },
  })
  const [beforeTokenBalance, beforeMarket] = await Promise.all([
    getTokenBalance({
      publicClient,
      userAddress: walletClient.account.address,
      tokenAddress,
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
  expect(beforeMarket.asks.length).toEqual(0)
  await waitForTransaction({ transaction, publicClient, walletClient })

  const [afterTokenBalance, afterMarket] = await Promise.all([
    getTokenBalance({
      publicClient,
      userAddress: walletClient.account.address,
      tokenAddress,
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
  expect(beforeTokenBalance - afterTokenBalance).toEqual(999999999973000000000n)
  expect(afterMarket.asks.length).toEqual(1)
  expect(afterMarket.asks[0].price).toEqual(
    '0.0100000308447012157335509249431491091294164907932184860328561626374721527099609375',
  )
  expect(afterMarket.asks[0].baseAmount).toEqual('1000.30009')

  expect(make.amount).toEqual('1000')
  expect(make.currency.address).toEqual(tokenAddress)
  expect(make.price).toEqual(
    '0.0100000308447012157335509249431491091294164907932184860328561626374721527099609375',
  )

  expect(spent.amount).toEqual('0')
  expect(spent.currency.address).toEqual(tokenAddress)

  expect(taken.amount).toEqual('0')
  expect(taken.currency.address).toEqual(MOCK_USDC)
})

test('make ask at 0.01 with rounding down', async () => {
  const { publicClient, walletClient, tokenAddress } = await setUp('make')

  const {
    transaction,
    result: { make, taken, spent },
  } = await limitOrder({
    chainId: publicClient.chain.id,
    userAddress: walletClient.account.address,
    inputToken: tokenAddress,
    outputToken: MOCK_USDC,
    amount: '1000',
    price: '0.01',
    options: {
      rpcUrl: publicClient.transport.url!,
      postOnly: true,
      useSubgraph: false,
      roundingDownMakeAsk: true,
    },
  })
  const [beforeTokenBalance, beforeMarket] = await Promise.all([
    getTokenBalance({
      publicClient,
      userAddress: walletClient.account.address,
      tokenAddress,
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
  expect(beforeMarket.asks.length).toEqual(0)
  await waitForTransaction({ transaction, publicClient, walletClient })

  const [afterTokenBalance, afterMarket] = await Promise.all([
    getTokenBalance({
      publicClient,
      userAddress: walletClient.account.address,
      tokenAddress,
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
  expect(beforeTokenBalance - afterTokenBalance).toEqual(999999999973000000000n)
  expect(afterMarket.asks.length).toEqual(1)
  expect(afterMarket.asks[0].price).toEqual(
    '0.009999030941607050990746193040618222487776224627342713802136131562292575836181640625',
  )
  expect(afterMarket.asks[0].baseAmount).toEqual('1000.30009')

  expect(make.amount).toEqual('1000')
  expect(make.currency.address).toEqual(tokenAddress)
  expect(make.price).toEqual(
    '0.009999030941607050990746193040618222487776224627342713802136131562292575836181640625',
  )

  expect(spent.amount).toEqual('0')
  expect(spent.currency.address).toEqual(tokenAddress)

  expect(taken.amount).toEqual('0')
  expect(taken.currency.address).toEqual(MOCK_USDC)
})
