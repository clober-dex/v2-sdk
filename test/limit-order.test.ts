import { expect, test } from 'vitest'
import { limitOrder, signERC20Permit } from '@clober/v2-sdk'
import { formatUnits } from 'viem'
import { arbitrumSepolia } from 'viem/chains'

import { fetchTokenBalance } from './utils/currency'
import { fetchAskDepth, fetchBidDepth, getSize } from './utils/depth'
import { account, publicClient, walletClient } from './utils/constants'
import { cloberTestChain } from './utils/test-chain'

const IS_LOCAL = process.env.IS_LOCAL === 'true'

test.runIf(IS_LOCAL)('limit order in not open market', async () => {
  expect(
    await limitOrder({
      chainId: arbitrumSepolia.id,
      userAddress: '0x447ad4a108b5540c220f9f7e83723ac87c0f8fd8',
      inputToken: '0x447ad4a108b5540c220f9f7e83723ac87c0f8fd8',
      outputToken: '0x0000000000000000000000000000000000000000',
      amount: '10',
      price: '1000',
      options: {
        rpcUrl: publicClient.transport.url!,
      },
    }).catch((e) => e.message),
  ).toEqual(`
       import { openMarket } from '@clober/v2-sdk'

       const transaction = await openMarket(
            ${cloberTestChain.id},
           '0x447ad4a108b5540c220f9f7e83723ac87c0f8fd8',
           '0x0000000000000000000000000000000000000000',
       )
    `)
})

test.runIf(IS_LOCAL)('make bid order', async () => {
  const signature = await signERC20Permit({
    chainId: cloberTestChain.id,
    account,
    token: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    amount: '1000',
    options: {
      rpcUrl: publicClient.transport.url!,
    },
  })
  const transaction = await limitOrder({
    chainId: cloberTestChain.id,
    userAddress: account.address,
    inputToken: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    outputToken: '0x0000000000000000000000000000000000000000',
    amount: '1000',
    price: '0.01',
    options: {
      signature,
      rpcUrl: publicClient.transport.url!,
      postOnly: true,
    },
  })

  const [beforeBalance, beforeDepth] = await Promise.all([
    fetchTokenBalance(
      cloberTestChain.id,
      '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
      account.address,
      publicClient.transport.url!,
    ),
    fetchBidDepth(publicClient.transport.url!),
  ])

  const hash = await walletClient.sendTransaction({
    ...transaction!,
    account,
    gasPrice: transaction!.gasPrice! * 2n,
  })
  const receipt = await publicClient.waitForTransactionReceipt({ hash })
  expect(receipt.status).toBe('success')

  const [afterBalance, afterDepth] = await Promise.all([
    fetchTokenBalance(
      cloberTestChain.id,
      '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
      account.address,
      publicClient.transport.url!,
    ),
    fetchBidDepth(publicClient.transport.url!),
  ])

  expect(beforeBalance - afterBalance).toEqual(1000000000n)
  expect(getSize(afterDepth, 0, 0.01)).greaterThan(
    getSize(beforeDepth, 0, 0.01),
  )
})

test.runIf(IS_LOCAL)('make ask order', async () => {
  const transaction = await limitOrder({
    chainId: cloberTestChain.id,
    userAddress: account.address,
    inputToken: '0x0000000000000000000000000000000000000000',
    outputToken: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    amount: '0.001',
    price: '8000.01',
    options: {
      rpcUrl: publicClient.transport.url!,
      postOnly: true,
    },
  })

  const [beforeBalance, beforeDepth] = await Promise.all([
    publicClient.getBalance({
      address: account.address,
    }),
    fetchAskDepth(publicClient.transport.url!),
  ])

  const hash = await walletClient.sendTransaction({
    ...transaction!,
    account,
    gasPrice: transaction!.gasPrice! * 2n,
  })
  const receipt = await publicClient.waitForTransactionReceipt({ hash })
  expect(receipt.status).toBe('success')

  const [afterBalance, afterDepth] = await Promise.all([
    publicClient.getBalance({
      address: account.address,
    }),
    fetchAskDepth(publicClient.transport.url!),
  ])

  expect(Number(beforeBalance - afterBalance)).greaterThan(Number(10n ** 15n))
  expect(getSize(afterDepth, 8000, 8001)).greaterThan(
    getSize(beforeDepth, 8000, 8001),
  )
})

test.runIf(IS_LOCAL)('limit bid order', async () => {
  const beforeBidDepth = await fetchBidDepth(publicClient.transport.url!)
  const makeTx = await limitOrder({
    chainId: cloberTestChain.id,
    userAddress: account.address,
    inputToken: '0x0000000000000000000000000000000000000000',
    outputToken: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    amount: '0.001',
    price:
      beforeBidDepth.length === 0
        ? '5001'
        : (beforeBidDepth[0]!.price + 1).toString(),
    options: {
      rpcUrl: publicClient.transport.url!,
      postOnly: true,
    },
  })
  await publicClient.waitForTransactionReceipt({
    hash: await walletClient.sendTransaction({
      ...makeTx!,
      account,
      gasPrice: makeTx!.gasPrice! * 2n,
    }),
  })

  const [beforeUSDCBalance, beforeETHBalance] = await Promise.all([
    fetchTokenBalance(
      cloberTestChain.id,
      '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
      account.address,
      publicClient.transport.url!,
    ),
    publicClient.getBalance({
      address: account.address,
    }),
  ])
  const signature = await signERC20Permit({
    chainId: cloberTestChain.id,
    account,
    token: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    amount: '100000',
    options: {
      rpcUrl: publicClient.transport.url!,
    },
  })
  const transaction = await limitOrder({
    chainId: cloberTestChain.id,
    userAddress: account.address,
    inputToken: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    outputToken: '0x0000000000000000000000000000000000000000',
    amount: '100000',
    price:
      beforeBidDepth.length === 0
        ? '5002'
        : (beforeBidDepth[0]!.price + 2).toString(),
    options: {
      signature,
      rpcUrl: publicClient.transport.url!,
    },
  })

  const hash = await walletClient.sendTransaction({
    ...transaction!,
    account,
    gasPrice: transaction!.gasPrice! * 2n,
  })
  const receipt = await publicClient.waitForTransactionReceipt({ hash })
  expect(receipt.status).toBe('success')

  const [afterUSDCBalance, afterETHBalance] = await Promise.all([
    fetchTokenBalance(
      cloberTestChain.id,
      '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
      account.address,
      publicClient.transport.url!,
    ),
    publicClient.getBalance({
      address: account.address,
    }),
  ])

  expect(beforeUSDCBalance - afterUSDCBalance).toEqual(100000000000n)
  expect(Number(formatUnits(afterETHBalance, 18))).greaterThan(
    Number(formatUnits(beforeETHBalance, 18)),
  )
})

test.runIf(IS_LOCAL)('limit ask order', async () => {
  const beforeAskDepth = await fetchAskDepth(publicClient.transport.url!)
  const signature = await signERC20Permit({
    chainId: cloberTestChain.id,
    account,
    token: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    amount: '100',
    options: {
      rpcUrl: publicClient.transport.url!,
    },
  })
  const makeTx = await limitOrder({
    chainId: cloberTestChain.id,
    userAddress: account.address,
    inputToken: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    outputToken: '0x0000000000000000000000000000000000000000',
    amount: '100',
    price:
      beforeAskDepth.length === 0
        ? '4999'
        : (beforeAskDepth[0]!.price - 1).toString(),
    options: {
      signature,
      rpcUrl: publicClient.transport.url!,
      postOnly: true,
    },
  })
  await publicClient.waitForTransactionReceipt({
    hash: await walletClient.sendTransaction({
      ...makeTx!,
      account,
      gasPrice: makeTx!.gasPrice! * 2n,
    }),
  })

  const transaction = await limitOrder({
    chainId: cloberTestChain.id,
    userAddress: account.address,
    inputToken: '0x0000000000000000000000000000000000000000',
    outputToken: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    amount: '0.001',
    price:
      beforeAskDepth.length === 0
        ? '4998'
        : (beforeAskDepth[0]!.price - 2).toString(),
    options: {
      rpcUrl: publicClient.transport.url!,
    },
  })

  const [beforeUSDCBalance, beforeETHBalance] = await Promise.all([
    fetchTokenBalance(
      cloberTestChain.id,
      '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
      account.address,
      publicClient.transport.url!,
    ),
    publicClient.getBalance({
      address: account.address,
    }),
  ])

  const hash = await walletClient.sendTransaction({
    ...transaction!,
    account,
    gasPrice: transaction!.gasPrice! * 2n,
  })
  const receipt = await publicClient.waitForTransactionReceipt({ hash })
  expect(receipt.status).toBe('success')

  const [afterUSDCBalance, afterETHBalance] = await Promise.all([
    fetchTokenBalance(
      cloberTestChain.id,
      '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
      account.address,
      publicClient.transport.url!,
    ),
    publicClient.getBalance({
      address: account.address,
    }),
  ])

  expect(beforeETHBalance - afterETHBalance).toBeGreaterThan(1000000000000000)
  expect(Number(formatUnits(afterUSDCBalance, 18))).greaterThan(
    Number(formatUnits(beforeUSDCBalance, 18)),
  )
})
