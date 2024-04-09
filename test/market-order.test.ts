import { expect, test } from 'vitest'
import { marketOrder } from '@clober-dex/v2-sdk'

import { cloberTestChain } from './utils/test-chain'
import { publicClient } from './utils/constants'

test('market order in not open market', async () => {
  expect(
    await marketOrder(
      cloberTestChain.id,
      '0x447ad4a108b5540c220f9f7e83723ac87c0f8fd8',
      '0x447ad4a108b5540c220f9f7e83723ac87c0f8fd8',
      '0x0000000000000000000000000000000000000000',
      '10',
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

// test('market bid with unlimited slippage', async () => {
//   const signature = await signERC20Permit(
//     cloberTestChain.id,
//     account,
//     '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
//     '100',
//     { rpcUrl: publicClient.transport.url! },
//   )
//   const transaction = await marketOrder(
//     cloberTestChain.id,
//     account.address,
//     '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
//     '0x0000000000000000000000000000000000000000',
//     '100',
//     { signature, rpcUrl: publicClient.transport.url! },
//   )
//
//   const [beforeUSDCBalance, beforeETHBalance, beforeAskDepth] =
//     await Promise.all([
//       fetchTokenBalance(
//         cloberTestChain.id,
//         '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
//         account.address,
//         publicClient.transport.url!,
//       ),
//       publicClient.getBalance({
//         address: account.address,
//       }),
//       fetchAskDepth(publicClient.transport.url!),
//     ])
//   expect(beforeAskDepth.length).toBeGreaterThan(0)
//
//   await walletClient.sendTransaction({ ...transaction!, account })
//
//   const [afterUSDCBalance, afterETHBalance, afterAskDepth] = await Promise.all([
//     fetchTokenBalance(
//       cloberTestChain.id,
//       '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
//       account.address,
//       publicClient.transport.url!,
//     ),
//     publicClient.getBalance({
//       address: account.address,
//     }),
//     fetchAskDepth(publicClient.transport.url!),
//   ])
//
//   expect(Number(beforeUSDCBalance)).toBeGreaterThan(Number(afterUSDCBalance))
//   expect(Number(afterETHBalance)).toBeGreaterThan(Number(beforeETHBalance))
//   expect(beforeAskDepth.length).toBeGreaterThan(afterAskDepth.length)
//   expect(afterAskDepth.length).toBe(0)
// })
//
// test('market ask with unlimited slippage', async () => {
//   const transaction = await marketOrder(
//     cloberTestChain.id,
//     account.address,
//     '0x0000000000000000000000000000000000000000',
//     '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
//     '10',
//     { rpcUrl: publicClient.transport.url! },
//   )
//
//   const [beforeUSDCBalance, beforeETHBalance, beforeBidDepth] =
//     await Promise.all([
//       fetchTokenBalance(
//         cloberTestChain.id,
//         '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
//         account.address,
//         publicClient.transport.url!,
//       ),
//       publicClient.getBalance({
//         address: account.address,
//       }),
//       fetchBidDepth(publicClient.transport.url!),
//     ])
//   expect(beforeBidDepth.length).toBeGreaterThan(0)
//
//   await walletClient.sendTransaction({ ...transaction!, account })
//
//   const [afterUSDCBalance, afterETHBalance, afterBidDepth] = await Promise.all([
//     fetchTokenBalance(
//       cloberTestChain.id,
//       '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
//       account.address,
//       publicClient.transport.url!,
//     ),
//     publicClient.getBalance({
//       address: account.address,
//     }),
//     fetchBidDepth(publicClient.transport.url!),
//   ])
//
//   expect(Number(afterUSDCBalance)).toBeGreaterThan(Number(beforeUSDCBalance))
//   expect(Number(beforeETHBalance)).toBeGreaterThan(Number(afterETHBalance))
//   expect(beforeBidDepth.length).toBeGreaterThan(afterBidDepth.length)
//   expect(afterBidDepth.length).toBe(0)
// })
//
// test('market bid with slippage tolerate', async () => {
//   const market = await getMarket(
//     cloberTestChain.id,
//     '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
//     '0x0000000000000000000000000000000000000000',
//     { rpcUrl: publicClient.transport.url! },
//   )
//   const signature = await signERC20Permit(
//     cloberTestChain.id,
//     account,
//     '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
//     '1000000',
//     { rpcUrl: publicClient.transport.url! },
//   )
//   const transaction = await marketOrder(
//     cloberTestChain.id,
//     account.address,
//     '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
//     '0x0000000000000000000000000000000000000000',
//     '1000000',
//     {
//       signature,
//       rpcUrl: publicClient.transport.url!,
//       limitPrice: (market.asks[0]!.price + 1).toString(),
//     },
//   )
//
//   const [beforeUSDCBalance, beforeETHBalance, beforeAskDepth] =
//     await Promise.all([
//       fetchTokenBalance(
//         cloberTestChain.id,
//         '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
//         account.address,
//         publicClient.transport.url!,
//       ),
//       publicClient.getBalance({
//         address: account.address,
//       }),
//       fetchAskDepth(publicClient.transport.url!),
//     ])
//   expect(beforeAskDepth.length).toBeGreaterThan(1)
//
//   await walletClient.sendTransaction({ ...transaction!, account })
//
//   const [afterUSDCBalance, afterETHBalance, afterAskDepth] = await Promise.all([
//     fetchTokenBalance(
//       cloberTestChain.id,
//       '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
//       account.address,
//       publicClient.transport.url!,
//     ),
//     publicClient.getBalance({
//       address: account.address,
//     }),
//     fetchAskDepth(publicClient.transport.url!),
//   ])
//
//   expect(Number(beforeUSDCBalance)).toBeGreaterThan(Number(afterUSDCBalance))
//   expect(Number(afterETHBalance)).toBeGreaterThan(Number(beforeETHBalance))
//   expect(beforeAskDepth.length).toBeGreaterThan(afterAskDepth.length)
//   expect(afterAskDepth.length).toBeGreaterThan(0)
// })
//
// test('market ask with slippage tolerate', async () => {
//   const market = await getMarket(
//     cloberTestChain.id,
//     '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
//     '0x0000000000000000000000000000000000000000',
//     { rpcUrl: publicClient.transport.url! },
//   )
//   const transaction = await marketOrder(
//     cloberTestChain.id,
//     account.address,
//     '0x0000000000000000000000000000000000000000',
//     '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
//     '10',
//     {
//       rpcUrl: publicClient.transport.url!,
//       limitPrice: (market.bids[0]!.price - 1).toString(),
//     },
//   )
//
//   const [beforeUSDCBalance, beforeETHBalance, beforeBidDepth] =
//     await Promise.all([
//       fetchTokenBalance(
//         cloberTestChain.id,
//         '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
//         account.address,
//         publicClient.transport.url!,
//       ),
//       publicClient.getBalance({
//         address: account.address,
//       }),
//       fetchBidDepth(publicClient.transport.url!),
//     ])
//   expect(beforeBidDepth.length).toBeGreaterThan(1)
//
//   await walletClient.sendTransaction({ ...transaction!, account })
//
//   const [afterUSDCBalance, afterETHBalance, afterBidDepth] = await Promise.all([
//     fetchTokenBalance(
//       cloberTestChain.id,
//       '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
//       account.address,
//       publicClient.transport.url!,
//     ),
//     publicClient.getBalance({
//       address: account.address,
//     }),
//     fetchBidDepth(publicClient.transport.url!),
//   ])
//
//   expect(Number(afterUSDCBalance)).toBeGreaterThan(Number(beforeUSDCBalance))
//   expect(Number(beforeETHBalance)).toBeGreaterThan(Number(afterETHBalance))
//   expect(beforeBidDepth.length).toBeGreaterThan(afterBidDepth.length)
//   expect(afterBidDepth.length).toBeGreaterThan(0)
// })
