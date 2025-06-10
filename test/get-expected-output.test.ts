import { expect, test } from 'vitest'
import {
  getContractAddresses,
  getExpectedOutput,
  getMarket,
  invertTick,
  toPrice,
} from '@clober/v2-sdk'
import {
  createPublicClient,
  formatUnits,
  http,
  isAddressEqual,
  parseUnits,
  PublicClient,
  zeroAddress,
  zeroHash,
} from 'viem'
import { arbitrumSepolia } from 'viem/chains'

import { BOOK_VIEWER_ABI } from '../src/constants/abis/core/book-viewer-abi'
import { MAX_TICK } from '../src/constants/tick'

import { MOCK_USDC } from './constants'

const publicClient = createPublicClient({
  chain: arbitrumSepolia,
  transport: http(
    process.env.ARBITRUM_SEPOLIA_RPC_URL ||
      'https://arbitrum-sepolia-archive.allthatnode.com',
  ),
})

const isSpendResultEqual = async (
  publicClient: PublicClient,
  inputToken: `0x${string}`,
  outputToken: `0x${string}`,
  amountIn: string,
) => {
  const chain = publicClient.chain!
  const market = await getMarket({
    chainId: chain.id,
    token0: inputToken,
    token1: outputToken,
    options: {
      rpcUrl: publicClient.transport.url!,
      useSubgraph: false,
    },
  })

  const isBid = isAddressEqual(market.quote.address, inputToken)
  const inputCurrency = isBid ? market.quote : market.base

  const { takenAmount, spentAmount } = await getExpectedOutput({
    chainId: chain.id,
    inputToken,
    outputToken,
    amountIn,
    options: {
      rpcUrl: publicClient.transport.url!,
      useSubgraph: true,
    },
  })

  const [takenQuoteAmount, spentBaseAmount] = await publicClient.readContract({
    address: getContractAddresses({ chainId: chain.id }).BookViewer,
    abi: BOOK_VIEWER_ABI,
    functionName: 'getExpectedOutput',
    args: [
      {
        id: isBid ? BigInt(market.askBook.id) : BigInt(market.bidBook.id),
        limitPrice: toPrice(invertTick(MAX_TICK)),
        baseAmount: parseUnits(amountIn, inputCurrency.decimals),
        minQuoteAmount: 0n,
        hookData: zeroHash,
      },
    ],
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

test('get expected output ask', async () => {
  await isSpendResultEqual(publicClient, MOCK_USDC, zeroAddress, '1000.123')

  await isSpendResultEqual(publicClient, MOCK_USDC, zeroAddress, '40000')

  await isSpendResultEqual(publicClient, MOCK_USDC, zeroAddress, '100000')

  await isSpendResultEqual(publicClient, MOCK_USDC, zeroAddress, '1000000')
})

test('get expected output bid', async () => {
  await isSpendResultEqual(publicClient, zeroAddress, MOCK_USDC, '0.01')

  await isSpendResultEqual(publicClient, zeroAddress, MOCK_USDC, '11')

  await isSpendResultEqual(publicClient, zeroAddress, MOCK_USDC, '15')

  await isSpendResultEqual(publicClient, zeroAddress, MOCK_USDC, '100')
})
