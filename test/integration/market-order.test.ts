import { expect, test } from 'vitest'
import { marketOrder, limitOrder } from 'v2-sdk/src'

import { setUp } from '../setup.ts'
import { MOCK_USDC } from '../utils/constants.ts'
import { waitForTransaction } from '../utils/transaction.ts'
import { getTokenBalance } from '../utils/currency.ts'

test('market buy with amountIn (usdc > token)', async () => {
  const { publicClient, walletClient, tokenAddress } = await setUp('market')

  await limitOrder({
    chainId: publicClient.chain.id,
    userAddress: walletClient.account.address,
    inputToken: tokenAddress,
    outputToken: MOCK_USDC,
    amount: '1.3',
    price: '2500.01',
    options: {
      rpcUrl: publicClient.transport.url!,
      postOnly: true,
      useSubgraph: false,
    },
  }).then(({ transaction }) =>
    waitForTransaction({ transaction, publicClient, walletClient }),
  )

  const [beforeUSDC, beforeToken] = await Promise.all([
    getTokenBalance({
      publicClient,
      userAddress: walletClient.account.address,
      tokenAddress: MOCK_USDC,
    }),
    getTokenBalance({
      publicClient,
      userAddress: walletClient.account.address,
      tokenAddress,
    }),
  ])

  const {
    transaction,
    result: { taken, spent },
  } = await marketOrder({
    chainId: publicClient.chain.id,
    userAddress: walletClient.account.address,
    inputToken: MOCK_USDC,
    outputToken: tokenAddress,
    amountIn: '1000',
    options: {
      rpcUrl: publicClient.transport.url!,
      useSubgraph: false,
      slippage: 0.005,
    },
  })

  await waitForTransaction({ transaction, publicClient, walletClient })

  const [afterUSDC, afterToken] = await Promise.all([
    getTokenBalance({
      publicClient,
      userAddress: walletClient.account.address,
      tokenAddress: MOCK_USDC,
    }),
    getTokenBalance({
      publicClient,
      userAddress: walletClient.account.address,
      tokenAddress,
    }),
  ])

  expect(beforeUSDC - afterUSDC).toBe(999997932n)
  expect(afterToken - beforeToken).toBe(399573027000000000n)

  expect(taken.amount).toBe('0.399573027')
  expect(taken.currency.address).toBe(tokenAddress)
  expect(taken.events.length).toBe(1)
  expect(taken.events[0].price).toBe(
    '2500.1635904793213452390240000944546093446089508882668184241993003524839878082275390625',
  )

  expect(spent.amount).toBe('999.997932')
  expect(spent.currency.address).toBe(MOCK_USDC)
  expect(spent.events.length).toBe(1)
  expect(spent.events[0].price).toBe(
    '2500.1635904793213452390240000944546093446089508882668184241993003524839878082275390625',
  )
})

test('market sell with amountIn (token > usdc)', async () => {
  const { publicClient, walletClient, tokenAddress } = await setUp('market')

  await limitOrder({
    chainId: publicClient.chain.id,
    userAddress: walletClient.account.address,
    inputToken: MOCK_USDC,
    outputToken: tokenAddress,
    amount: '4000',
    price: '2500.01',
    options: {
      rpcUrl: publicClient.transport.url!,
      postOnly: true,
      useSubgraph: false,
    },
  }).then(({ transaction }) =>
    waitForTransaction({ transaction, publicClient, walletClient }),
  )

  const [beforeUSDC, beforeToken] = await Promise.all([
    getTokenBalance({
      publicClient,
      userAddress: walletClient.account.address,
      tokenAddress: MOCK_USDC,
    }),
    getTokenBalance({
      publicClient,
      userAddress: walletClient.account.address,
      tokenAddress,
    }),
  ])

  const {
    transaction,
    result: { taken, spent },
  } = await marketOrder({
    chainId: publicClient.chain.id,
    userAddress: walletClient.account.address,
    inputToken: tokenAddress,
    outputToken: MOCK_USDC,
    amountIn: '0.5',
    options: {
      rpcUrl: publicClient.transport.url!,
      useSubgraph: false,
      slippage: 0.005,
    },
  })

  await waitForTransaction({ transaction, publicClient, walletClient })

  const [afterUSDC, afterToken] = await Promise.all([
    getTokenBalance({
      publicClient,
      userAddress: walletClient.account.address,
      tokenAddress: MOCK_USDC,
    }),
    getTokenBalance({
      publicClient,
      userAddress: walletClient.account.address,
      tokenAddress,
    }),
  ])

  expect(afterUSDC - beforeUSDC).toBe(1248706842n)
  expect(beforeToken - afterToken).toBe(499999999776110382n)

  expect(spent.amount).toBe('0.499999999776110382')
  expect(spent.currency.address).toBe(tokenAddress)
  expect(spent.events.length).toBe(1)
  expect(spent.events[0].price).toBe(
    '2499.91359911940940429445461260259447994181401797586516977389692328870296478271484375',
  )

  expect(taken.amount).toBe('1248.706842')
  expect(taken.currency.address).toBe(MOCK_USDC)
  expect(taken.events.length).toBe(1)
  expect(taken.events[0].price).toBe(
    '2499.91359911940940429445461260259447994181401797586516977389692328870296478271484375',
  )
})

test('market buy with amountOut (usdc > token)', async () => {
  const { publicClient, walletClient, tokenAddress } = await setUp('market')

  await limitOrder({
    chainId: publicClient.chain.id,
    userAddress: walletClient.account.address,
    inputToken: tokenAddress,
    outputToken: MOCK_USDC,
    amount: '1.3',
    price: '2500.01',
    options: {
      rpcUrl: publicClient.transport.url!,
      postOnly: true,
      useSubgraph: false,
    },
  }).then(({ transaction }) =>
    waitForTransaction({ transaction, publicClient, walletClient }),
  )

  const [beforeUSDC, beforeToken] = await Promise.all([
    getTokenBalance({
      publicClient,
      userAddress: walletClient.account.address,
      tokenAddress: MOCK_USDC,
    }),
    getTokenBalance({
      publicClient,
      userAddress: walletClient.account.address,
      tokenAddress,
    }),
  ])

  const {
    transaction,
    result: { taken, spent },
  } = await marketOrder({
    chainId: publicClient.chain.id,
    userAddress: walletClient.account.address,
    inputToken: MOCK_USDC,
    outputToken: tokenAddress,
    amountOut: '0.5',
    options: {
      rpcUrl: publicClient.transport.url!,
      useSubgraph: false,
      slippage: 0.005,
    },
  })

  await waitForTransaction({ transaction, publicClient, walletClient })

  const [afterUSDC, afterToken] = await Promise.all([
    getTokenBalance({
      publicClient,
      userAddress: walletClient.account.address,
      tokenAddress: MOCK_USDC,
    }),
    getTokenBalance({
      publicClient,
      userAddress: walletClient.account.address,
      tokenAddress,
    }),
  ])

  expect(beforeUSDC - afterUSDC).toBe(1251334378n)
  expect(afterToken - beforeToken).toBe(500000499000000000n)

  expect(taken.amount).toBe('0.500000499')
  expect(taken.currency.address).toBe(tokenAddress)
  expect(taken.events.length).toBe(1)
  expect(taken.events[0].price).toBe(
    '2500.1635904793213452390240000944546093446089508882668184241993003524839878082275390625',
  )

  expect(spent.amount).toBe('1251.334378')
  expect(spent.currency.address).toBe(MOCK_USDC)
  expect(spent.events.length).toBe(1)
  expect(spent.events[0].price).toBe(
    '2500.1635904793213452390240000944546093446089508882668184241993003524839878082275390625',
  )
})

test('market sell with amountOut (token > usdc)', async () => {
  const { publicClient, walletClient, tokenAddress } = await setUp('market')

  await limitOrder({
    chainId: publicClient.chain.id,
    userAddress: walletClient.account.address,
    inputToken: MOCK_USDC,
    outputToken: tokenAddress,
    amount: '4000',
    price: '2500.01',
    options: {
      rpcUrl: publicClient.transport.url!,
      postOnly: true,
      useSubgraph: false,
    },
  }).then(({ transaction }) =>
    waitForTransaction({ transaction, publicClient, walletClient }),
  )

  const [beforeUSDC, beforeToken] = await Promise.all([
    getTokenBalance({
      publicClient,
      userAddress: walletClient.account.address,
      tokenAddress: MOCK_USDC,
    }),
    getTokenBalance({
      publicClient,
      userAddress: walletClient.account.address,
      tokenAddress,
    }),
  ])

  const {
    transaction,
    result: { taken, spent },
  } = await marketOrder({
    chainId: publicClient.chain.id,
    userAddress: walletClient.account.address,
    inputToken: tokenAddress,
    outputToken: MOCK_USDC,
    amountOut: '1000',
    options: {
      rpcUrl: publicClient.transport.url!,
      useSubgraph: false,
      slippage: 0.005,
    },
  })

  await waitForTransaction({ transaction, publicClient, walletClient })

  const [afterUSDC, afterToken] = await Promise.all([
    getTokenBalance({
      publicClient,
      userAddress: walletClient.account.address,
      tokenAddress: MOCK_USDC,
    }),
    getTokenBalance({
      publicClient,
      userAddress: walletClient.account.address,
      tokenAddress,
    }),
  ])

  expect(afterUSDC - beforeUSDC).toBe(1000000000n)
  expect(beforeToken - afterToken).toBe(400414239257149133n)

  expect(spent.amount).toBe('0.400414239257149133')
  expect(spent.currency.address).toBe(tokenAddress)
  expect(spent.events.length).toBe(1)
  expect(spent.events[0].price).toBe(
    '2499.91359911940940429445461260259447994181401797586516977389692328870296478271484375',
  )

  expect(taken.amount).toBe('1000')
  expect(taken.currency.address).toBe(MOCK_USDC)
  expect(taken.events.length).toBe(1)
  expect(taken.events[0].price).toBe(
    '2499.91359911940940429445461260259447994181401797586516977389692328870296478271484375',
  )
})

test('market buy fails with slippage 0 (usdc > token)', async () => {
  const { publicClient, walletClient, tokenAddress } = await setUp('market')

  await limitOrder({
    chainId: publicClient.chain.id,
    userAddress: walletClient.account.address,
    inputToken: tokenAddress,
    outputToken: MOCK_USDC,
    amount: '1.3',
    price: '2500.01',
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
    amount: '1.3',
    price: '3000',
    options: {
      rpcUrl: publicClient.transport.url!,
      postOnly: true,
      useSubgraph: false,
    },
  }).then(({ transaction }) =>
    waitForTransaction({ transaction, publicClient, walletClient }),
  )

  const { transaction } = await marketOrder({
    chainId: publicClient.chain.id,
    userAddress: walletClient.account.address,
    inputToken: MOCK_USDC,
    outputToken: tokenAddress,
    amountIn: '1000',
    options: {
      rpcUrl: publicClient.transport.url!,
      useSubgraph: false,
      slippage: 0.5,
    },
  })

  await marketOrder({
    chainId: publicClient.chain.id,
    userAddress: walletClient.account.address,
    inputToken: MOCK_USDC,
    outputToken: tokenAddress,
    amountIn: '3000',
    options: {
      rpcUrl: publicClient.transport.url!,
      useSubgraph: false,
      slippage: 0.5,
    },
  }).then(({ transaction }) =>
    waitForTransaction({ transaction, publicClient, walletClient }),
  )

  await expect(
    waitForTransaction({ transaction, publicClient, walletClient }),
  ).rejects.toThrowError()
})

test('market sell fails with slippage 0 (token > usdc)', async () => {
  const { publicClient, walletClient, tokenAddress } = await setUp('market')

  await limitOrder({
    chainId: publicClient.chain.id,
    userAddress: walletClient.account.address,
    inputToken: MOCK_USDC,
    outputToken: tokenAddress,
    amount: '4000',
    price: '2500.01',
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
    amount: '4000',
    price: '2000',
    options: {
      rpcUrl: publicClient.transport.url!,
      postOnly: true,
      useSubgraph: false,
    },
  }).then(({ transaction }) =>
    waitForTransaction({ transaction, publicClient, walletClient }),
  )

  const { transaction } = await marketOrder({
    chainId: publicClient.chain.id,
    userAddress: walletClient.account.address,
    inputToken: tokenAddress,
    outputToken: MOCK_USDC,
    amountIn: '0.5',
    options: {
      rpcUrl: publicClient.transport.url!,
      useSubgraph: false,
      slippage: 0.5,
    },
  })

  await marketOrder({
    chainId: publicClient.chain.id,
    userAddress: walletClient.account.address,
    inputToken: tokenAddress,
    outputToken: MOCK_USDC,
    amountIn: '3',
    options: {
      rpcUrl: publicClient.transport.url!,
      useSubgraph: false,
      slippage: 0.5,
    },
  }).then(({ transaction }) =>
    waitForTransaction({ transaction, publicClient, walletClient }),
  )

  await expect(
    waitForTransaction({ transaction, publicClient, walletClient }),
  ).rejects.toThrowError()
})
