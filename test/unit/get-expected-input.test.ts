import { expect, test } from 'vitest'
import {
  getContractAddresses,
  getExpectedInput,
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

import { BOOK_VIEWER_ABI } from '../../src/constants/abis/core/book-viewer-abi'
import { MAX_TICK } from '../../src/constants/tick'
import { MOCK_USDC } from '../utils/constants'

const publicClient = createPublicClient({
  chain: arbitrumSepolia,
  transport: http(
    process.env.ARBITRUM_SEPOLIA_RPC_URL ||
      'https://arbitrum-sepolia-archive.allthatnode.com',
  ),
})

const isTakeResultEqual = async (
  publicClient: PublicClient,
  inputToken: `0x${string}`,
  outputToken: `0x${string}`,
  amountOut: string,
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
  const outputCurrency = isBid ? market.base : market.quote

  const { takenAmount, spentAmount } = await getExpectedInput({
    chainId: chain.id,
    inputToken,
    outputToken,
    amountOut,
    options: {
      rpcUrl: publicClient.transport.url!,
      useSubgraph: true,
    },
  })

  const [takenQuoteAmount, spentBaseAmount] = await publicClient.readContract({
    address: getContractAddresses({ chainId: chain.id }).BookViewer,
    abi: BOOK_VIEWER_ABI,
    functionName: 'getExpectedInput',
    args: [
      {
        id: isBid ? BigInt(market.askBook.id) : BigInt(market.bidBook.id),
        limitPrice: toPrice(invertTick(MAX_TICK)),
        quoteAmount: parseUnits(amountOut, outputCurrency.decimals),
        maxBaseAmount: 0n,
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

test('get expected input ask', async () => {
  await isTakeResultEqual(publicClient, MOCK_USDC, zeroAddress, '0.01')

  await isTakeResultEqual(publicClient, MOCK_USDC, zeroAddress, '11')

  await isTakeResultEqual(publicClient, MOCK_USDC, zeroAddress, '15')

  await isTakeResultEqual(publicClient, MOCK_USDC, zeroAddress, '100')
})

test('get expected input bid', async () => {
  await isTakeResultEqual(publicClient, zeroAddress, MOCK_USDC, '1000.123')

  await isTakeResultEqual(publicClient, zeroAddress, MOCK_USDC, '40000')

  await isTakeResultEqual(publicClient, zeroAddress, MOCK_USDC, '100000')

  await isTakeResultEqual(publicClient, zeroAddress, MOCK_USDC, '1000000')
})
