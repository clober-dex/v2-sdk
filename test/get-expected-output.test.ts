import { expect, test } from 'vitest'
import { getExpectedOutput } from '@clober-dex/v2-sdk'
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
            name: 'baseAmount',
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
    address: BOOK_VIEWER_CONTRACT_ADDRESS,
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
        hookData: zeroHash,
      },
    ],
  })

  const { takenAmount, spendAmount } = await getExpectedOutput(
    arbitrumSepolia.id,
    inputToken,
    outputToken,
    amountIn,
    limitPrice,
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
  const { takenAmount, spendAmount } = await isSpendResultEqual(
    '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    '0x0000000000000000000000000000000000000000',
    '1000.123',
    '100',
  )
  expect(takenAmount).toBe('0')
  expect(spendAmount).toBe('0')

  await isSpendResultEqual(
    '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    '0x0000000000000000000000000000000000000000',
    '1000000',
    '4005',
  )

  await isSpendResultEqual(
    '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    '0x0000000000000000000000000000000000000000',
    '1000.123',
    '10000',
  )

  await isSpendResultEqual(
    '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    '0x0000000000000000000000000000000000000000',
    '1000000',
    (Math.pow(2, 256) - 1).toFixed(0),
  )
})

test('get expected output bid', async () => {
  const { takenAmount, spendAmount } = await isSpendResultEqual(
    '0x0000000000000000000000000000000000000000',
    '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    '0.01',
    '4010',
  )
  expect(takenAmount).toBe('0')
  expect(spendAmount).toBe('0')

  await isSpendResultEqual(
    '0x0000000000000000000000000000000000000000',
    '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    '0.1',
    '4005',
  )

  await isSpendResultEqual(
    '0x0000000000000000000000000000000000000000',
    '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    '1.1234',
    '200',
  )

  await isSpendResultEqual(
    '0x0000000000000000000000000000000000000000',
    '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    '3.14',
    '0',
  )
})
