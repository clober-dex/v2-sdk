import { expect, test } from 'vitest'
import { getExpectedOutput } from '@clober-dex/v2-sdk'
import { arbitrumSepolia } from 'viem/chains'
import { formatUnits, isAddressEqual, parseUnits, zeroHash } from 'viem'

import { fetchMarket } from '../src/apis/market'
import { parsePrice } from '../src/utils/prices'
import { invertPrice } from '../src/utils/tick'
import { CONTRACT_ADDRESSES } from '../src/constants/addresses'

import { publicClient } from './utils/constants'

const _ABI = [
  {
    inputs: [
      {
        components: [
          {
            internalType: 'BookId',
            name: 'id',
            type: 'uint192',
          },
          {
            internalType: 'uint256',
            name: 'limitPrice',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'baseAmount',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'minQuoteAmount',
            type: 'uint256',
          },
          {
            internalType: 'bytes',
            name: 'hookData',
            type: 'bytes',
          },
        ],
        internalType: 'struct IController.SpendOrderParams',
        name: 'params',
        type: 'tuple',
      },
    ],
    name: 'getExpectedOutput',
    outputs: [
      {
        internalType: 'uint256',
        name: 'takenQuoteAmount',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'spendBaseAmount',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const

const isSpendResultEqual = async (
  inputToken: `0x${string}`,
  outputToken: `0x${string}`,
  amountIn: string,
  limitPrice: string,
) => {
  const market = await fetchMarket(arbitrumSepolia.id, [
    inputToken,
    outputToken,
  ])

  const isBid = isAddressEqual(market.quote.address, inputToken)
  const inputCurrency = isBid ? market.quote : market.base
  const [takenQuoteAmount, spendBaseAmount] = await publicClient.readContract({
    address: CONTRACT_ADDRESSES[arbitrumSepolia.id]!.BookViewer,
    abi: _ABI,
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
              ),
            )
          : parsePrice(
              Number(limitPrice),
              market.quote.decimals,
              market.base.decimals,
            ),
        baseAmount: parseUnits(amountIn, inputCurrency.decimals),
        minQuoteAmount: 0n,
        hookData: zeroHash,
      },
    ],
  })

  const { takenAmount, spendAmount } = await getExpectedOutput(
    arbitrumSepolia.id,
    inputToken,
    outputToken,
    amountIn,
    { limitPrice, rpcUrl: publicClient.transport.url! },
  )

  expect(takenAmount).toBe(
    formatUnits(
      takenQuoteAmount,
      isBid ? market.base.decimals : market.quote.decimals,
    ),
  )
  expect(spendAmount).toBe(
    formatUnits(
      spendBaseAmount,
      isBid ? market.quote.decimals : market.base.decimals,
    ),
  )
  return {
    takenAmount,
    spendAmount,
  }
}

test('get expected output ask', async () => {
  await isSpendResultEqual(
    '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    '0x0000000000000000000000000000000000000000',
    '1000.123',
    '100.01',
  )

  await isSpendResultEqual(
    '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    '0x0000000000000000000000000000000000000000',
    '1000000',
    '4005.01',
  )

  await isSpendResultEqual(
    '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    '0x0000000000000000000000000000000000000000',
    '1000.123',
    '10000.01',
  )

  await isSpendResultEqual(
    '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    '0x0000000000000000000000000000000000000000',
    '1000000',
    (Math.pow(2, 256) - 1).toFixed(0),
  )
})

test('get expected output bid', async () => {
  await isSpendResultEqual(
    '0x0000000000000000000000000000000000000000',
    '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    '0.01',
    '4010.01',
  )

  await isSpendResultEqual(
    '0x0000000000000000000000000000000000000000',
    '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    '0.1',
    '4005.01',
  )

  await isSpendResultEqual(
    '0x0000000000000000000000000000000000000000',
    '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    '1.1234',
    '200.01',
  )

  await isSpendResultEqual(
    '0x0000000000000000000000000000000000000000',
    '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    '3.14',
    '0',
  )
})

test('get max expected output', async () => {
  const { spendAmount: spendAmount1, takenAmount: takenAmount1 } =
    await getExpectedOutput(
      arbitrumSepolia.id,
      '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
      '0x0000000000000000000000000000000000000000',
      '5000',
      { rpcUrl: publicClient.transport.url! },
    )
  expect(Number(spendAmount1)).toBeGreaterThan(0)
  expect(Number(takenAmount1)).toBeGreaterThan(0)

  const { spendAmount: spendAmount2, takenAmount: takenAmount2 } =
    await getExpectedOutput(
      arbitrumSepolia.id,
      '0x0000000000000000000000000000000000000000',
      '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
      '1.3',
      { rpcUrl: publicClient.transport.url! },
    )
  expect(Number(spendAmount2)).toBeGreaterThan(0)
  expect(Number(takenAmount2)).toBeGreaterThan(0)
})

// @dev: this test will be fail when the market is open
test('get expected output in not open book', async () => {
  const { takenAmount, spendAmount } = await getExpectedOutput(
    arbitrumSepolia.id,
    '0xf18Be2a91cF31Fc3f8D828b6c714e1806a75e0AA',
    '0x0000000000000000000000000000000000000000',
    '10000',
    { rpcUrl: publicClient.transport.url! },
  )
  expect(takenAmount).toBe('0')
  expect(spendAmount).toBe('0')
})
