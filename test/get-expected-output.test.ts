import { expect, test } from 'vitest'
import { getExpectedOutput, getMarket } from '@clober/v2-sdk'
import {
  formatUnits,
  isAddressEqual,
  parseUnits,
  PublicClient,
  zeroHash,
} from 'viem'

import { parsePrice } from '../src/utils/prices'
import { invertPrice } from '../src/utils/tick'
import { CONTRACT_ADDRESSES } from '../src/constants/addresses'
import { BOOK_VIEWER_ABI } from '../src/abis/core/book-viewer-abi'
import { buildPublicClient } from '../src/constants/client'
import { cloberTestChain } from '../src/constants/test-chain'

import { createProxyClients } from './utils/utils'

const isSpendResultEqual = async (
  publicClient: PublicClient,
  inputToken: `0x${string}`,
  outputToken: `0x${string}`,
  amountIn: string,
  limitPrice: string,
) => {
  const market = await getMarket({
    chainId: cloberTestChain.id,
    token0: inputToken,
    token1: outputToken,
    options: {
      rpcUrl: publicClient.transport.url!,
      useSubgraph: false,
    },
  })

  const isBid = isAddressEqual(market.quote.address, inputToken)
  const inputCurrency = isBid ? market.quote : market.base
  const [takenQuoteAmount, spentBaseAmount] = await publicClient.readContract({
    address: CONTRACT_ADDRESSES[cloberTestChain.id]!.BookViewer,
    abi: BOOK_VIEWER_ABI,
    functionName: 'getExpectedOutput',
    args: [
      {
        id: isBid
          ? 2753017174304248252793812478093441832431186343406437115611n
          : 2505799676027433010421416925405481572661563164234992034276n,
        limitPrice: isBid
          ? invertPrice(
              parsePrice(
                Number(limitPrice),
                market.quote.decimals,
                market.base.decimals,
              ).roundingDownPrice,
            )
          : parsePrice(
              Number(limitPrice),
              market.quote.decimals,
              market.base.decimals,
            ).roundingUpPrice,
        baseAmount: parseUnits(amountIn, inputCurrency.decimals),
        minQuoteAmount: 0n,
        hookData: zeroHash,
      },
    ],
  })

  const { takenAmount, spentAmount } = await getExpectedOutput({
    chainId: cloberTestChain.id,
    inputToken,
    outputToken,
    amountIn,
    options: {
      limitPrice,
      rpcUrl: publicClient.transport.url!,
      useSubgraph: false,
    },
  })

  expect(takenAmount).toBe(
    formatUnits(
      takenQuoteAmount,
      isBid ? market.base.decimals : market.quote.decimals,
    ),
  )
  expect(spentAmount).toBe(
    formatUnits(
      spentBaseAmount,
      isBid ? market.quote.decimals : market.base.decimals,
    ),
  )
  return {
    takenAmount,
    spentAmount,
  }
}

const clients = createProxyClients(
  Array.from({ length: 3 }, () => Math.floor(new Date().getTime())).map(
    (id) => id,
  ),
)

test('get expected output ask', async () => {
  const { publicClient } = clients[1] as any
  buildPublicClient(cloberTestChain.id, publicClient.transport.url!)

  await isSpendResultEqual(
    publicClient,
    '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    '0x0000000000000000000000000000000000000000',
    '1000.123',
    '100.01',
  )

  await isSpendResultEqual(
    publicClient,
    '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    '0x0000000000000000000000000000000000000000',
    '1000000',
    '3505.01',
  )

  await isSpendResultEqual(
    publicClient,
    '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    '0x0000000000000000000000000000000000000000',
    '1000.123',
    '3605.01',
  )

  await isSpendResultEqual(
    publicClient,
    '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    '0x0000000000000000000000000000000000000000',
    '1000000',
    (Math.pow(2, 256) - 1).toFixed(0),
  )
})

test('get expected output bid', async () => {
  const { publicClient } = clients[1] as any
  buildPublicClient(cloberTestChain.id, publicClient.transport.url!)

  await isSpendResultEqual(
    publicClient,
    '0x0000000000000000000000000000000000000000',
    '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    '0.01',
    '3490.01',
  )

  await isSpendResultEqual(
    publicClient,
    '0x0000000000000000000000000000000000000000',
    '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    '0.1',
    '3200.16',
  )

  await isSpendResultEqual(
    publicClient,
    '0x0000000000000000000000000000000000000000',
    '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    '1.1234',
    '200.12',
  )

  await isSpendResultEqual(
    publicClient,
    '0x0000000000000000000000000000000000000000',
    '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    '3.14',
    '0',
  )
})

test('get expected output in not open book', async () => {
  const { publicClient } = clients[2] as any
  buildPublicClient(cloberTestChain.id, publicClient.transport.url!)

  const { takenAmount, spentAmount } = await getExpectedOutput({
    chainId: cloberTestChain.id,
    inputToken: '0x0e12A07A610056067063cB208882fD5a032B1505',
    outputToken: '0x0000000000000000000000000000000000000000',
    amountIn: '10000',
    options: {
      useSubgraph: false,
      rpcUrl: publicClient.transport.url!,
    },
  })
  expect(takenAmount).toBe('0')
  expect(spentAmount).toBe('0')
})
