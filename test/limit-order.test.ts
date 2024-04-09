import { expect, test } from 'vitest'
import { limitOrder, signERC20Permit } from '@clober-dex/v2-sdk'
import { formatUnits } from 'viem'
import { arbitrumSepolia } from 'viem/chains'

import { fetchTokenBalance } from './utils/currency'
import { fetchAskDepth, fetchBidDepth, getSize } from './utils/depth'
import { account, publicClient, walletClient } from './utils/constants'
import { cloberTestChain } from './utils/test-chain'

test('limit order in not open market', async () => {
  expect(
    await limitOrder(
      arbitrumSepolia.id,
      '0x447ad4a108b5540c220f9f7e83723ac87c0f8fd8',
      '0x447ad4a108b5540c220f9f7e83723ac87c0f8fd8',
      '0x0000000000000000000000000000000000000000',
      '10',
      '1000',
      { rpcUrl: publicClient.transport.url! },
    ).catch((e) => e.message),
  ).toEqual(`
       import { openMarket } from '@clober-dex/v2-sdk'

       const transaction = await openMarket(
            ${cloberTestChain.id},
           '0x447ad4a108b5540c220f9f7e83723ac87c0f8fd8',
           '0x0000000000000000000000000000000000000000',
       )
    `)
})

test('make bid order', async () => {
  const signature = await signERC20Permit(
    cloberTestChain.id,
    account,
    '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    '1000',
    { rpcUrl: publicClient.transport.url! },
  )
  const transaction = await limitOrder(
    cloberTestChain.id,
    account.address,
    '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    '0x0000000000000000000000000000000000000000',
    '1000',
    '0.01',
    { signature, rpcUrl: publicClient.transport.url!, postOnly: true },
  )

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

test('make ask order', async () => {
  const transaction = await limitOrder(
    cloberTestChain.id,
    account.address,
    '0x0000000000000000000000000000000000000000',
    '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    '0.001',
    '8000.01',
    { rpcUrl: publicClient.transport.url!, postOnly: true },
  )

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

test('limit bid order', async () => {
  const beforeBidDepth = await fetchBidDepth(publicClient.transport.url!)
  const makeTx = await limitOrder(
    cloberTestChain.id,
    account.address,
    '0x0000000000000000000000000000000000000000',
    '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    '0.001',
    beforeBidDepth.length === 0
      ? '5001'
      : (beforeBidDepth[0]!.price + 1).toString(),
    { rpcUrl: publicClient.transport.url!, postOnly: true },
  )
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
  const signature = await signERC20Permit(
    cloberTestChain.id,
    account,
    '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    '100000',
    { rpcUrl: publicClient.transport.url! },
  )
  const transaction = await limitOrder(
    cloberTestChain.id,
    account.address,
    '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    '0x0000000000000000000000000000000000000000',
    '100000',
    beforeBidDepth.length === 0
      ? '5002'
      : (beforeBidDepth[0]!.price + 2).toString(),
    { signature, rpcUrl: publicClient.transport.url! },
  )

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

test('limit ask order', async () => {
  const beforeAskDepth = await fetchAskDepth(publicClient.transport.url!)
  const signature = await signERC20Permit(
    cloberTestChain.id,
    account,
    '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    '100',
    { rpcUrl: publicClient.transport.url! },
  )
  const makeTx = await limitOrder(
    cloberTestChain.id,
    account.address,
    '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    '0x0000000000000000000000000000000000000000',
    '100',
    beforeAskDepth.length === 0
      ? '4999'
      : (beforeAskDepth[0]!.price - 1).toString(),
    { signature, rpcUrl: publicClient.transport.url!, postOnly: true },
  )
  await publicClient.waitForTransactionReceipt({
    hash: await walletClient.sendTransaction({
      ...makeTx!,
      account,
      gasPrice: makeTx!.gasPrice! * 2n,
    }),
  })

  const transaction = await limitOrder(
    cloberTestChain.id,
    account.address,
    '0x0000000000000000000000000000000000000000',
    '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    '0.001',
    beforeAskDepth.length === 0
      ? '4998'
      : (beforeAskDepth[0]!.price - 2).toString(),
    { rpcUrl: publicClient.transport.url! },
  )

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
