import { expect, test } from 'vitest'
import { cancelOrder, claimOrder, getMarket, limitOrder } from '@clober/v2-sdk'

import { setUp } from '../setup'
import { MOCK_USDC } from '../utils/constants'
import { waitForTransaction } from '../utils/transaction'
import { getDepth } from '../utils/depth'
import { getTokenBalance } from '../utils/currency'
import { getOpenOrderIdFromReceipt, getOpenOrders } from '../utils/order'

test('make at exactly price', async () => {
  const { publicClient, walletClient, tokenAddress } = await setUp('limit')

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
  const { publicClient, walletClient, tokenAddress } = await setUp('limit')

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
  const { publicClient, walletClient, tokenAddress } = await setUp('limit')

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
  const { publicClient, walletClient, tokenAddress } = await setUp('limit')

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
  const { publicClient, walletClient, tokenAddress } = await setUp('limit')

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
  const { publicClient, walletClient, tokenAddress } = await setUp('limit')

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

test('limit bid > claim > cancel', async () => {
  const { publicClient, walletClient, tokenAddress, market } =
    await setUp('limit')

  const openOrder1 = await limitOrder({
    chainId: publicClient.chain.id,
    userAddress: walletClient.account.address,
    inputToken: tokenAddress,
    outputToken: MOCK_USDC,
    amount: '1000',
    price: '1.0001',
    options: {
      rpcUrl: publicClient.transport.url!,
      postOnly: true,
      useSubgraph: false,
    },
  }).then(async ({ transaction }) => {
    const receipt = await waitForTransaction({
      transaction,
      publicClient,
      walletClient,
    })
    const orderId = getOpenOrderIdFromReceipt({
      chainId: publicClient.chain.id,
      receipt,
    })
    return getOpenOrders({
      publicClient,
      orderIds: orderId ? [orderId] : [],
    })
  })
  expect(openOrder1).toEqual([
    {
      open: 1000300090n,
      claimable: 0n,
      orderId: openOrder1[0].orderId,
      owner: walletClient.account.address,
      provider: '0x0000000000000000000000000000000000000000',
    },
  ])

  const openOrder2 = await limitOrder({
    chainId: publicClient.chain.id,
    userAddress: walletClient.account.address,
    inputToken: tokenAddress,
    outputToken: MOCK_USDC,
    amount: '1000',
    price: '1.0002',
    options: {
      rpcUrl: publicClient.transport.url!,
      postOnly: true,
      useSubgraph: false,
    },
  }).then(async ({ transaction }) => {
    const receipt = await waitForTransaction({
      transaction,
      publicClient,
      walletClient,
    })
    const orderId = getOpenOrderIdFromReceipt({
      chainId: publicClient.chain.id,
      receipt,
    })
    return getOpenOrders({
      publicClient,
      orderIds: orderId ? [orderId] : [],
    })
  })
  expect(openOrder2).toEqual([
    {
      open: 1000300090n,
      claimable: 0n,
      orderId: openOrder2[0].orderId,
      owner: walletClient.account.address,
      provider: '0x0000000000000000000000000000000000000000',
    },
  ])

  expect(
    await getDepth({
      publicClient,
      bookId: BigInt(market.askBook.id),
    }),
  ).toEqual([
    { tick: 276323, depth: 1000300090n },
    { tick: 276322, depth: 1000300090n },
  ])

  const {
    transaction,
    result: { make, taken, spent },
  } = await limitOrder({
    chainId: publicClient.chain.id,
    userAddress: walletClient.account.address,
    inputToken: MOCK_USDC,
    outputToken: tokenAddress,
    amount: '2000',
    price: '1.000103',
    options: {
      rpcUrl: publicClient.transport.url!,
      postOnly: false,
      useSubgraph: false,
    },
  })

  const [beforeUSDC, beforeToken] = await Promise.all([
    getTokenBalance({
      publicClient,
      userAddress: walletClient.account.address,
      tokenAddress: MOCK_USDC,
    }),
    getTokenBalance({
      publicClient,
      userAddress: walletClient.account.address,
      tokenAddress: tokenAddress,
    }),
  ])

  await waitForTransaction({
    transaction,
    publicClient,
    walletClient,
  })

  const [afterUSDC, afterToken] = await Promise.all([
    getTokenBalance({
      publicClient,
      userAddress: walletClient.account.address,
      tokenAddress: MOCK_USDC,
    }),
    getTokenBalance({
      publicClient,
      userAddress: walletClient.account.address,
      tokenAddress: tokenAddress,
    }),
  ])
  const [bidDepths, askDepths] = await Promise.all([
    getDepth({
      publicClient,
      bookId: BigInt(market.bidBook.id),
    }),
    getDepth({
      publicClient,
      bookId: BigInt(market.askBook.id),
    }),
  ])

  expect(beforeUSDC - afterUSDC).toEqual(2000000000n)
  expect(afterToken - beforeToken).toEqual(999299789910000000000n)
  expect(bidDepths).toEqual([{ tick: -276323, depth: 999897204n }])
  expect(askDepths).toEqual([{ tick: 276322, depth: 1000300090n }])

  expect(make.amount).toEqual('999.597235')
  expect(make.currency.address).toEqual(MOCK_USDC)
  expect(make.price).toEqual(
    '1.00010264409533375529728112865347577250239342883109117110507213510572910308837890625',
  )

  expect(taken.amount).toEqual('999.29978991')
  expect(taken.currency.address).toEqual(tokenAddress)
  expect(taken.events.length).toEqual(1)
  expect(taken.events[0].price).toEqual(
    '1.00010264409533375529728112865347577250239342883109117110507213510572910308837890625',
  )

  expect(spent.amount).toEqual('1000.402765')
  expect(spent.currency.address).toEqual(MOCK_USDC)
  expect(spent.events.length).toEqual(1)
  expect(spent.events[0].price).toEqual(
    '1.00010264409533375529728112865347577250239342883109117110507213510572910308837890625',
  )

  const beforeOpenOrders = await getOpenOrders({
    publicClient,
    orderIds: [openOrder1[0].orderId, openOrder2[0].orderId],
  })
  expect(beforeOpenOrders).toEqual([
    {
      open: 0n,
      claimable: 1000300090n,
      orderId: beforeOpenOrders[0].orderId,
      owner: walletClient.account.address,
      provider: '0x0000000000000000000000000000000000000000',
    },
    {
      open: 1000300090n,
      claimable: 0n,
      orderId: beforeOpenOrders[1].orderId,
      owner: walletClient.account.address,
      provider: '0x0000000000000000000000000000000000000000',
    },
  ])

  await claimOrder({
    chainId: publicClient.chain.id,
    userAddress: walletClient.account.address,
    id: openOrder1[0].orderId.toString(),
    options: {
      rpcUrl: publicClient.transport.url!,
      useSubgraph: false,
    },
  }).then(({ transaction }) =>
    waitForTransaction({ transaction, publicClient, walletClient }),
  )

  await cancelOrder({
    chainId: publicClient.chain.id,
    userAddress: walletClient.account.address,
    id: openOrder2[0].orderId.toString(),
    options: {
      rpcUrl: publicClient.transport.url!,
      useSubgraph: false,
    },
  }).then(({ transaction }) =>
    waitForTransaction({ transaction, publicClient, walletClient }),
  )

  const afterOpenOrders = await getOpenOrders({
    publicClient,
    orderIds: [openOrder1[0].orderId, openOrder2[0].orderId],
  })
  expect(afterOpenOrders).toEqual([
    {
      open: 0n,
      claimable: 0n,
      orderId: afterOpenOrders[0].orderId,
      owner: undefined,
      provider: '0x0000000000000000000000000000000000000000',
    },
    {
      open: 0n,
      claimable: 0n,
      orderId: afterOpenOrders[1].orderId,
      owner: undefined,
      provider: '0x0000000000000000000000000000000000000000',
    },
  ])
})

test('limit bid with rounding take', async () => {
  const { publicClient, walletClient, tokenAddress, market } =
    await setUp('limit')

  await limitOrder({
    chainId: publicClient.chain.id,
    userAddress: walletClient.account.address,
    inputToken: tokenAddress,
    outputToken: MOCK_USDC,
    amount: '1000',
    price: '1.0001',
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
    amount: '1000',
    price: '1.0002',
    options: {
      rpcUrl: publicClient.transport.url!,
      postOnly: true,
      useSubgraph: false,
    },
  }).then(({ transaction }) =>
    waitForTransaction({ transaction, publicClient, walletClient }),
  )

  expect(
    await getDepth({
      publicClient,
      bookId: BigInt(market.askBook.id),
    }),
  ).toEqual([
    { tick: 276323, depth: 1000300090n },
    { tick: 276322, depth: 1000300090n },
  ])

  const {
    transaction,
    result: { make, taken, spent },
  } = await limitOrder({
    chainId: publicClient.chain.id,
    userAddress: walletClient.account.address,
    inputToken: MOCK_USDC,
    outputToken: tokenAddress,
    amount: '2000',
    price: '1.000103',
    options: {
      rpcUrl: publicClient.transport.url!,
      postOnly: false,
      useSubgraph: false,
      roundingUpTakenAsk: true,
    },
  })

  const [beforeUSDC, beforeToken] = await Promise.all([
    getTokenBalance({
      publicClient,
      userAddress: walletClient.account.address,
      tokenAddress: MOCK_USDC,
    }),
    getTokenBalance({
      publicClient,
      userAddress: walletClient.account.address,
      tokenAddress: tokenAddress,
    }),
  ])

  await waitForTransaction({
    transaction,
    publicClient,
    walletClient,
  })

  const [afterUSDC, afterToken] = await Promise.all([
    getTokenBalance({
      publicClient,
      userAddress: walletClient.account.address,
      tokenAddress: MOCK_USDC,
    }),
    getTokenBalance({
      publicClient,
      userAddress: walletClient.account.address,
      tokenAddress: tokenAddress,
    }),
  ])
  const [bidDepths, askDepths] = await Promise.all([
    getDepth({
      publicClient,
      bookId: BigInt(market.bidBook.id),
    }),
    getDepth({
      publicClient,
      bookId: BigInt(market.askBook.id),
    }),
  ])

  expect(beforeUSDC - afterUSDC).toEqual(2000000000n)
  expect(afterToken - beforeToken).toEqual(1997695098207000000000n)
  expect(bidDepths).toEqual([])
  expect(askDepths).toEqual([{ tick: 276322, depth: 905387n }])

  expect(make.amount).toEqual('0')
  expect(make.currency.address).toEqual(MOCK_USDC)
  expect(make.price).toEqual(
    '1.00010264409533375529728112865347577250239342883109117110507213510572910308837890625',
  )

  expect(taken.amount).toEqual('1997.695098207')
  expect(taken.currency.address).toEqual(tokenAddress)
  expect(taken.events.length).toEqual(2)
  expect(taken.events[0].price).toEqual(
    '1.00010264409533375529728112865347577250239342883109117110507213510572910308837890625',
  )
  expect(taken.events[1].price).toEqual(
    '1.000202654359743287953369711204778353544147216636073238760218373499810695648193359375',
  )

  expect(spent.amount).toEqual('2000')
  expect(spent.currency.address).toEqual(MOCK_USDC)
  expect(spent.events.length).toEqual(2)
  expect(spent.events[0].price).toEqual(
    '1.00010264409533375529728112865347577250239342883109117110507213510572910308837890625',
  )
  expect(spent.events[1].price).toEqual(
    '1.000202654359743287953369711204778353544147216636073238760218373499810695648193359375',
  )
})

test('limit ask > claim > cancel', async () => {
  const { publicClient, walletClient, tokenAddress, market } =
    await setUp('limit')

  const openOrder1 = await limitOrder({
    chainId: publicClient.chain.id,
    userAddress: walletClient.account.address,
    inputToken: MOCK_USDC,
    outputToken: tokenAddress,
    amount: '1000',
    price: '1.0001',
    options: {
      rpcUrl: publicClient.transport.url!,
      postOnly: true,
      useSubgraph: false,
    },
  }).then(async ({ transaction }) => {
    const receipt = await waitForTransaction({
      transaction,
      publicClient,
      walletClient,
    })
    const orderId = getOpenOrderIdFromReceipt({
      chainId: publicClient.chain.id,
      receipt,
    })
    return getOpenOrders({
      publicClient,
      orderIds: orderId ? [orderId] : [],
    })
  })
  expect(openOrder1).toEqual([
    {
      open: 1000300090n,
      claimable: 0n,
      orderId: openOrder1[0].orderId,
      owner: walletClient.account.address,
      provider: '0x0000000000000000000000000000000000000000',
    },
  ])

  const openOrder2 = await limitOrder({
    chainId: publicClient.chain.id,
    userAddress: walletClient.account.address,
    inputToken: MOCK_USDC,
    outputToken: tokenAddress,
    amount: '1000',
    price: '1.0002',
    options: {
      rpcUrl: publicClient.transport.url!,
      postOnly: true,
      useSubgraph: false,
    },
  }).then(async ({ transaction }) => {
    const receipt = await waitForTransaction({
      transaction,
      publicClient,
      walletClient,
    })
    const orderId = getOpenOrderIdFromReceipt({
      chainId: publicClient.chain.id,
      receipt,
    })
    return getOpenOrders({
      publicClient,
      orderIds: orderId ? [orderId] : [],
    })
  })
  expect(openOrder2).toEqual([
    {
      open: 1000300090n,
      claimable: 0n,
      orderId: openOrder2[0].orderId,
      owner: walletClient.account.address,
      provider: '0x0000000000000000000000000000000000000000',
    },
  ])

  expect(
    await getDepth({
      publicClient,
      bookId: BigInt(market.bidBook.id),
    }),
  ).toEqual([
    { tick: -276323, depth: 1000300090n },
    { tick: -276324, depth: 1000300090n },
  ])

  const {
    transaction,
    result: { make, taken, spent },
  } = await limitOrder({
    chainId: publicClient.chain.id,
    userAddress: walletClient.account.address,
    inputToken: tokenAddress,
    outputToken: MOCK_USDC,
    amount: '2000',
    price: '1.000102',
    options: {
      rpcUrl: publicClient.transport.url!,
      postOnly: false,
      useSubgraph: false,
    },
  })

  const [beforeUSDC, beforeToken] = await Promise.all([
    getTokenBalance({
      publicClient,
      userAddress: walletClient.account.address,
      tokenAddress: MOCK_USDC,
    }),
    getTokenBalance({
      publicClient,
      userAddress: walletClient.account.address,
      tokenAddress: tokenAddress,
    }),
  ])

  await waitForTransaction({
    transaction,
    publicClient,
    walletClient,
  })

  const [afterUSDC, afterToken] = await Promise.all([
    getTokenBalance({
      publicClient,
      userAddress: walletClient.account.address,
      tokenAddress: MOCK_USDC,
    }),
    getTokenBalance({
      publicClient,
      userAddress: walletClient.account.address,
      tokenAddress: tokenAddress,
    }),
  ])
  const [bidDepths, askDepths] = await Promise.all([
    getDepth({
      publicClient,
      bookId: BigInt(market.bidBook.id),
    }),
    getDepth({
      publicClient,
      bookId: BigInt(market.askBook.id),
    }),
  ])

  expect(afterUSDC - beforeUSDC).toEqual(999299789n)
  expect(beforeToken - afterToken).toEqual(1999999999858590021975n)
  expect(bidDepths).toEqual([{ tick: -276324, depth: 1000300090n }])
  expect(askDepths).toEqual([{ tick: 276323, depth: 1000102605n }])

  expect(make.amount).toEqual('999.802574359909978025')
  expect(make.currency.address).toEqual(tokenAddress)
  expect(make.price).toEqual(
    '1.00010264409533375529728112865347577250239342883109117110507213510572910308837890625',
  )

  expect(taken.amount).toEqual('999.299789')
  expect(taken.currency.address).toEqual(MOCK_USDC)
  expect(taken.events.length).toEqual(1)
  expect(taken.events[0].price).toEqual(
    '1.00010264409533375529728112865347577250239342883109117110507213510572910308837890625',
  )

  expect(spent.amount).toEqual('1000.197425640090021975')
  expect(spent.currency.address).toEqual(tokenAddress)
  expect(spent.events.length).toEqual(1)
  expect(spent.events[0].price).toEqual(
    '1.00010264409533375529728112865347577250239342883109117110507213510572910308837890625',
  )

  const beforeOpenOrders = await getOpenOrders({
    publicClient,
    orderIds: [openOrder1[0].orderId, openOrder2[0].orderId],
  })
  expect(beforeOpenOrders).toEqual([
    {
      open: 1000300090n,
      claimable: 0n,
      orderId: beforeOpenOrders[0].orderId,
      owner: walletClient.account.address,
      provider: '0x0000000000000000000000000000000000000000',
    },
    {
      open: 0n,
      claimable: 1000300090n,
      orderId: beforeOpenOrders[1].orderId,
      owner: walletClient.account.address,
      provider: '0x0000000000000000000000000000000000000000',
    },
  ])

  await claimOrder({
    chainId: publicClient.chain.id,
    userAddress: walletClient.account.address,
    id: openOrder1[0].orderId.toString(),
    options: {
      rpcUrl: publicClient.transport.url!,
      useSubgraph: false,
    },
  }).then(({ transaction }) =>
    waitForTransaction({ transaction, publicClient, walletClient }),
  )

  await cancelOrder({
    chainId: publicClient.chain.id,
    userAddress: walletClient.account.address,
    id: openOrder2[0].orderId.toString(),
    options: {
      rpcUrl: publicClient.transport.url!,
      useSubgraph: false,
    },
  }).then(({ transaction }) =>
    waitForTransaction({ transaction, publicClient, walletClient }),
  )

  const afterOpenOrders = await getOpenOrders({
    publicClient,
    orderIds: [openOrder1[0].orderId, openOrder2[0].orderId],
  })
  expect(afterOpenOrders).toEqual([
    {
      open: 1000300090n,
      claimable: 0n,
      orderId: afterOpenOrders[0].orderId,
      owner: walletClient.account.address,
      provider: '0x0000000000000000000000000000000000000000',
    },
    {
      open: 0n,
      claimable: 1000300090n,
      orderId: afterOpenOrders[1].orderId,
      owner: walletClient.account.address,
      provider: '0x0000000000000000000000000000000000000000',
    },
  ])
})

test('limit ask with rounding take', async () => {
  const { publicClient, walletClient, tokenAddress, market } =
    await setUp('limit')

  await limitOrder({
    chainId: publicClient.chain.id,
    userAddress: walletClient.account.address,
    inputToken: MOCK_USDC,
    outputToken: tokenAddress,
    amount: '1000',
    price: '1.0001',
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
    inputToken: MOCK_USDC,
    outputToken: tokenAddress,
    amount: '1000',
    price: '1.0002',
    options: {
      rpcUrl: publicClient.transport.url!,
      postOnly: true,
      useSubgraph: false,
    },
  }).then(({ transaction }) =>
    waitForTransaction({ transaction, publicClient, walletClient }),
  )

  expect(
    await getDepth({
      publicClient,
      bookId: BigInt(market.bidBook.id),
    }),
  ).toEqual([
    { tick: -276323, depth: 1000300090n },
    { tick: -276324, depth: 1000300090n },
  ])

  const {
    transaction,
    result: { make, taken, spent },
  } = await limitOrder({
    chainId: publicClient.chain.id,
    userAddress: walletClient.account.address,
    inputToken: tokenAddress,
    outputToken: MOCK_USDC,
    amount: '2000',
    price: '1.000102',
    options: {
      rpcUrl: publicClient.transport.url!,
      postOnly: false,
      useSubgraph: false,
      roundingDownTakenBid: true,
    },
  })

  const [beforeUSDC, beforeToken] = await Promise.all([
    getTokenBalance({
      publicClient,
      userAddress: walletClient.account.address,
      tokenAddress: MOCK_USDC,
    }),
    getTokenBalance({
      publicClient,
      userAddress: walletClient.account.address,
      tokenAddress: tokenAddress,
    }),
  ])

  await waitForTransaction({
    transaction,
    publicClient,
    walletClient,
  })

  const [afterUSDC, afterToken] = await Promise.all([
    getTokenBalance({
      publicClient,
      userAddress: walletClient.account.address,
      tokenAddress: MOCK_USDC,
    }),
    getTokenBalance({
      publicClient,
      userAddress: walletClient.account.address,
      tokenAddress: tokenAddress,
    }),
  ])

  const [bidDepths, askDepths] = await Promise.all([
    getDepth({
      publicClient,
      bookId: BigInt(market.bidBook.id),
    }),
    getDepth({
      publicClient,
      bookId: BigInt(market.askBook.id),
    }),
  ])

  expect(afterUSDC - beforeUSDC).toEqual(1998105200n)
  expect(beforeToken - afterToken).toEqual(1999999999331101144697n)
  expect(bidDepths).toEqual([{ tick: -276324, depth: 494873n }])
  expect(askDepths).toEqual([])

  expect(make.amount).toEqual('0.000000668898855303')
  expect(make.currency.address).toEqual(tokenAddress)
  expect(make.price).toEqual(
    '1.00010264409533375529728112865347577250239342883109117110507213510572910308837890625',
  )

  expect(taken.amount).toEqual('1998.1052')
  expect(taken.currency.address).toEqual(MOCK_USDC)
  expect(taken.events.length).toEqual(2)
  expect(taken.events[0].price).toEqual(
    '1.00010264409533375529728112865347577250239342883109117110507213510572910308837890625',
  )
  expect(taken.events[1].price).toEqual(
    '1.000002643830950663458323031790500220780779257190307163227771525271236896514892578125',
  )

  expect(spent.amount).toEqual('1999.999999331101144697')
  expect(spent.currency.address).toEqual(tokenAddress)
  expect(spent.events.length).toEqual(2)
  expect(spent.events[0].price).toEqual(
    '1.00010264409533375529728112865347577250239342883109117110507213510572910308837890625',
  )
  expect(spent.events[1].price).toEqual(
    '1.000002643830950663458323031790500220780779257190307163227771525271236896514892578125',
  )
})
