import { expect, test } from 'vitest'
import {
  getMarket,
  placeMarketMakingQuotes,
  parseMakeOrderIdsFromReceipt,
} from '@clober/v2-sdk'

import { setUp } from '../setup'
import { MOCK_USDC } from '../utils/constants'
import { waitForTransaction } from '../utils/transaction'
import { getTokenBalance } from '../utils/currency'

test('make batch orders', async () => {
  const { publicClient, walletClient, tokenAddress } = await setUp('make')

  const transaction = await placeMarketMakingQuotes({
    chainId: publicClient.chain.id,
    userAddress: walletClient.account.address,
    baseToken: tokenAddress,
    quoteToken: MOCK_USDC,
    quotes: {
      ask: [
        { price: '4000', amount: '1.2' },
        { price: '3000', amount: '1.1' },
      ],
      bid: [
        { price: '2000', amount: '3000' },
        { price: '1000', amount: '1500' },
      ],
    },
    options: {
      rpcUrl: publicClient.transport.url!,
      useSubgraph: false,
      gas: 3000000n,
      orderIdsToClaim: [],
      orderIdsToCancel: [],
    },
  })
  const [beforeUSDCBalance, beforeTokenBalance, beforeMarket] =
    await Promise.all([
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
  const transactionReceipt = await waitForTransaction({
    transaction,
    publicClient,
    walletClient,
  })

  const [afterUSDCBalance, afterTokenBalance, afterMarket] = await Promise.all([
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

  expect(beforeUSDCBalance - afterUSDCBalance).toEqual(4500000000n)
  expect(beforeTokenBalance - afterTokenBalance).toEqual(2299999793000000000n)
  expect(afterMarket.bids.length).toEqual(2)
  expect(afterMarket.asks.length).toEqual(2)
  expect(afterMarket.bids).toEqual([
    {
      price:
        '1999.8403056175265088029208519713107625217205810808085431062863790430128574371337890625',
      tick: -200312,
      baseAmount: '1.500569951295865234',
    },
    {
      price:
        '999.901992673290376853696139747769352268920504782367952856247939052991569042205810546875',
      tick: -207244,
      baseAmount: '1.500597204520482986',
    },
  ])
  expect(afterMarket.asks).toEqual([
    {
      price:
        '3000.104290406328548371982130792782835944162316867134254749771571368910372257232666015625',
      tick: 196256,
      baseAmount: '1.10033',
    },
    {
      price:
        '4000.153228421545533166824957065435488069984003821344398232895400724373757839202880859375',
      tick: 193379,
      baseAmount: '1.20036',
    },
  ])

  const { bidOrderIds, askOrderIds } = parseMakeOrderIdsFromReceipt({
    transactionReceipt,
    market: afterMarket,
  })
  expect(bidOrderIds.length).toEqual(2)
  expect(askOrderIds.length).toEqual(2)
})
