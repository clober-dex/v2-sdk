import { expect, test } from 'vitest'
import { getExpectedInput } from '@clober-dex/v2-sdk'
import { arbitrumSepolia } from 'viem/chains'
import {
  createPublicClient,
  formatUnits,
  http,
  isAddressEqual,
  parseUnits,
  zeroHash,
} from 'viem'

import { fetchMarket } from '../src/apis/market'
import { parsePrice } from '../src/utils/prices'
import { invertPrice } from '../src/utils/tick'

const BOOK_VIEWER_CONTRACT_ADDRESS =
  '0x8676558Af8D8a4A7fd7fC6A7b435D231393a2A76'
const publicClient = createPublicClient({
  chain: arbitrumSepolia,
  transport: http(),
})

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

const isSpendResultEqual = async (
  inputToken: `0x${string}`,
  outputToken: `0x${string}`,
  amountOut: string,
  limitPrice: string,
) => {
  const market = await fetchMarket(arbitrumSepolia.id, [
    inputToken,
    outputToken,
  ])

  const isBid = isAddressEqual(market.quote.address, inputToken)
  const outputCurrency = isBid ? market.base : market.quote
  const [takenQuoteAmount, spendBaseAmount] = await publicClient.readContract({
    address: BOOK_VIEWER_CONTRACT_ADDRESS,
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
        hookData: zeroHash,
      },
    ],
  })

  const { takenAmount, spendAmount } = await getExpectedInput(
    arbitrumSepolia.id,
    inputToken,
    outputToken,
    amountOut,
    { limitPrice },
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

test('get expected input ask', async () => {
  const { takenAmount, spendAmount } = await isSpendResultEqual(
    '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    '0x0000000000000000000000000000000000000000',
    '0.1',
    '100',
  )
  expect(takenAmount).toBe('0')
  expect(spendAmount).toBe('0')

  await isSpendResultEqual(
    '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    '0x0000000000000000000000000000000000000000',
    '0.2',
    '4005',
  )

  await isSpendResultEqual(
    '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    '0x0000000000000000000000000000000000000000',
    '0.23',
    '10000',
  )

  await isSpendResultEqual(
    '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    '0x0000000000000000000000000000000000000000',
    '10',
    (Math.pow(2, 256) - 1).toFixed(0),
  )
})

test('get expected input bid', async () => {
  const { takenAmount, spendAmount } = await isSpendResultEqual(
    '0x0000000000000000000000000000000000000000',
    '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    '100000',
    '4010',
  )
  expect(takenAmount).toBe('0')
  expect(spendAmount).toBe('0')

  await isSpendResultEqual(
    '0x0000000000000000000000000000000000000000',
    '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    '100000',
    '4005',
  )

  await isSpendResultEqual(
    '0x0000000000000000000000000000000000000000',
    '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    '100000',
    '200',
  )

  await isSpendResultEqual(
    '0x0000000000000000000000000000000000000000',
    '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    '200000',
    '0',
  )
})

test('get expected input in not open book', async () => {
  const { takenAmount, spendAmount } = await getExpectedInput(
    arbitrumSepolia.id,
    '0xf18201e84ab80beef65c1eb68eea1eb1006d0e69',
    '0x0000000000000000000000000000000000000000',
    '0.1',
  )
  expect(takenAmount).toBe('0')
  expect(spendAmount).toBe('0')
})
