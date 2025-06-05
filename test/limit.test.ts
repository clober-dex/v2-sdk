import { expect, test } from 'vitest'
import { limitOrder } from '@clober/v2-sdk'

import { setUp } from './setup'
import { MOCK_USDC } from './constants'
import { waitForTransaction } from './utils/transaction'
import { getDepth } from './utils/depth'
import { getTokenBalance } from './utils/currency'

test('limit bid', async () => {
  const { publicClient, walletClient, tokenAddress, market } = await setUp()

  const { transaction: tx1 } = await limitOrder({
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
  })
  await waitForTransaction({
    transaction: tx1,
    publicClient,
    walletClient,
  })

  const { transaction: tx2 } = await limitOrder({
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
  })
  await waitForTransaction({
    transaction: tx2,
    publicClient,
    walletClient,
  })

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
    transaction: tx3,
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

  const [beforeUSDCBalance, beforeTokenBalance] = await Promise.all([
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
    transaction: tx3,
    publicClient,
    walletClient,
  })

  const [afterUSDCBalance, afterTokenBalance] = await Promise.all([
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

  expect(beforeUSDCBalance - afterUSDCBalance).toEqual(2000000000n)
  expect(afterTokenBalance - beforeTokenBalance).toEqual(999299789910000000000n)
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
})

test('limit bid with rounding take', async () => {
  const { publicClient, walletClient, tokenAddress, market } = await setUp()

  const { transaction: tx1 } = await limitOrder({
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
  })
  await waitForTransaction({
    transaction: tx1,
    publicClient,
    walletClient,
  })

  const { transaction: tx2 } = await limitOrder({
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
  })
  await waitForTransaction({
    transaction: tx2,
    publicClient,
    walletClient,
  })

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
    transaction: tx3,
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

  const [beforeUSDCBalance, beforeTokenBalance] = await Promise.all([
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
    transaction: tx3,
    publicClient,
    walletClient,
  })

  const [afterUSDCBalance, afterTokenBalance] = await Promise.all([
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

  expect(beforeUSDCBalance - afterUSDCBalance).toEqual(2000000000n)
  expect(afterTokenBalance - beforeTokenBalance).toEqual(
    1997695098207000000000n,
  )
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

test('limit ask', async () => {
  const { publicClient, walletClient, tokenAddress, market } = await setUp()

  const { transaction: tx1 } = await limitOrder({
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
  })
  await waitForTransaction({
    transaction: tx1,
    publicClient,
    walletClient,
  })

  const { transaction: tx2 } = await limitOrder({
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
  })
  await waitForTransaction({
    transaction: tx2,
    publicClient,
    walletClient,
  })

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
    transaction: tx3,
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

  const [beforeUSDCBalance, beforeTokenBalance] = await Promise.all([
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
    transaction: tx3,
    publicClient,
    walletClient,
  })

  const [afterUSDCBalance, afterTokenBalance] = await Promise.all([
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

  expect(afterUSDCBalance - beforeUSDCBalance).toEqual(999299789n)
  expect(beforeTokenBalance - afterTokenBalance).toEqual(
    1999999999858590021975n,
  )
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
})

test('limit ask with rounding take', async () => {
  const { publicClient, walletClient, tokenAddress, market } = await setUp()

  const { transaction: tx1 } = await limitOrder({
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
  })
  await waitForTransaction({
    transaction: tx1,
    publicClient,
    walletClient,
  })

  const { transaction: tx2 } = await limitOrder({
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
  })
  await waitForTransaction({
    transaction: tx2,
    publicClient,
    walletClient,
  })

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
    transaction: tx3,
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

  const [beforeUSDCBalance, beforeTokenBalance] = await Promise.all([
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
    transaction: tx3,
    publicClient,
    walletClient,
  })

  const [afterUSDCBalance, afterTokenBalance] = await Promise.all([
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

  expect(afterUSDCBalance - beforeUSDCBalance).toEqual(1998105200n)
  expect(beforeTokenBalance - afterTokenBalance).toEqual(
    1999999999331101144697n,
  )
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
