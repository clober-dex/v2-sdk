import { expect, test } from 'vitest'
import { getExpectedInput, getMarket } from '@clober/v2-sdk'
import { arbitrumSepolia } from 'viem/chains'
import { formatUnits, isAddressEqual, parseUnits, zeroHash } from 'viem'

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
            name: 'quoteAmount',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'maxBaseAmount',
            type: 'uint256',
          },
          {
            internalType: 'bytes',
            name: 'hookData',
            type: 'bytes',
          },
        ],
        internalType: 'struct IController.TakeOrderParams',
        name: 'params',
        type: 'tuple',
      },
    ],
    name: 'getExpectedInput',
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

const isTakeResultEqual = async (
  inputToken: `0x${string}`,
  outputToken: `0x${string}`,
  amountOut: string,
  limitPrice: string,
) => {
  const market = await getMarket({
    chainId: arbitrumSepolia.id,
    token0: inputToken,
    token1: outputToken,
    options: {
      rpcUrl: publicClient.transport.url!,
    },
  })

  const isBid = isAddressEqual(market.quote.address, inputToken)
  const outputCurrency = isBid ? market.base : market.quote
  const [takenQuoteAmount, spendBaseAmount] = await publicClient.readContract({
    address: CONTRACT_ADDRESSES[arbitrumSepolia.id]!.BookViewer,
    abi: _ABI,
    functionName: 'getExpectedInput',
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
        quoteAmount: parseUnits(amountOut, outputCurrency.decimals),
        maxBaseAmount: 0n,
        hookData: zeroHash,
      },
    ],
  })

  const { takenAmount, spendAmount } = await getExpectedInput({
    chainId: arbitrumSepolia.id,
    inputToken,
    outputToken,
    amountOut,
    options: {
      limitPrice,
      rpcUrl: publicClient.transport.url!,
    },
  })

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

test('get expected input ask', async () => {
  await isTakeResultEqual(
    '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    '0x0000000000000000000000000000000000000000',
    '0.1',
    '100.01',
  )

  await isTakeResultEqual(
    '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    '0x0000000000000000000000000000000000000000',
    '0.2',
    '4005.01',
  )

  await isTakeResultEqual(
    '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    '0x0000000000000000000000000000000000000000',
    '0.23',
    '10000.01',
  )

  await isTakeResultEqual(
    '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    '0x0000000000000000000000000000000000000000',
    '10',
    (Math.pow(2, 256) - 1).toFixed(0),
  )
})

test('get expected input bid', async () => {
  await isTakeResultEqual(
    '0x0000000000000000000000000000000000000000',
    '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    '100000',
    '4010.01',
  )

  await isTakeResultEqual(
    '0x0000000000000000000000000000000000000000',
    '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    '100000',
    '4005.16',
  )

  await isTakeResultEqual(
    '0x0000000000000000000000000000000000000000',
    '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    '100000',
    '200.12',
  )

  await isTakeResultEqual(
    '0x0000000000000000000000000000000000000000',
    '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    '200000',
    '0',
  )
})

// @dev: this test will be fail when the market is open
test('get expected input in not open book', async () => {
  const { takenAmount, spendAmount } = await getExpectedInput({
    chainId: arbitrumSepolia.id,
    inputToken: '0xf18Be2a91cF31Fc3f8D828b6c714e1806a75e0AA',
    outputToken: '0x0000000000000000000000000000000000000000',
    amountOut: '0.1',
    options: {
      rpcUrl: publicClient.transport.url!,
    },
  })
  expect(takenAmount).toBe('0')
  expect(spendAmount).toBe('0')
})
