import { encodeFunctionData, formatUnits, parseUnits } from 'viem'

import { CHAIN_IDS, isTestnetChain } from '../constants/chain'
import { MOCK_SWAP_ABI } from '../abis/rebalancer/mock-swap-abi'
import { Currency } from '../model/currency'

export async function fetchOdosApi<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const endpoint = `https://api.odos.xyz/${path}`
  const response = await fetch(endpoint, options)

  if (response.ok) {
    return response.json()
  } else {
    const errorResponse = await response.json()

    throw new Error(errorResponse.message || 'Unknown Error')
  }
}

export async function fetchQuote({
  chainId,
  amountIn,
  tokenIn,
  tokenOut,
  slippageLimitPercent,
  userAddress,
  testnetPrice,
}: {
  chainId: CHAIN_IDS
  amountIn: bigint
  tokenIn: Currency
  tokenOut: Currency
  slippageLimitPercent: number
  userAddress: `0x${string}`
  testnetPrice?: number | undefined // tokenOutAmount per tokenIn, for testnet chains only
}): Promise<{
  amountOut: bigint
  pathId: string
}> {
  if (isTestnetChain(chainId)) {
    if (!testnetPrice) {
      throw new Error('Missing testnetPrice for testnet chain')
    }

    return {
      amountOut: parseUnits(
        (
          Number(formatUnits(amountIn, tokenIn.decimals)) * testnetPrice
        ).toString(),
        tokenOut.decimals,
      ),
      pathId: '0x',
    }
  }
  const {
    outAmounts,
    pathId,
  }: {
    outAmounts: string[]
    pathId: string
  } = await fetchOdosApi('sor/quote/v2', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify({
      chainId,
      inputTokens: [
        {
          tokenAddress: tokenIn.address,
          amount: amountIn.toString(),
        },
      ],
      outputTokens: [
        {
          tokenAddress: tokenOut.address,
          proportion: 1,
        },
      ],
      userAddr: userAddress,
      slippageLimitPercent,
    }),
  })
  return {
    amountOut: BigInt(outAmounts[0]),
    pathId,
  }
}

export async function fetchCallData({
  chainId,
  amountIn,
  tokenIn,
  tokenOut,
  slippageLimitPercent,
  userAddress,
  testnetPrice,
}: {
  chainId: CHAIN_IDS
  amountIn: bigint
  tokenIn: Currency
  tokenOut: Currency
  slippageLimitPercent: number
  userAddress: `0x${string}`
  testnetPrice?: number | undefined // tokenOutAmount per tokenIn, for testnet chains only
}): Promise<{
  amountOut: bigint
  data: `0x${string}`
}> {
  if (isTestnetChain(chainId)) {
    if (!testnetPrice) {
      throw new Error('Missing testnetPrice for testnet chain')
    }

    const amountOut = parseUnits(
      (
        Number(formatUnits(amountIn, tokenIn.decimals)) * testnetPrice
      ).toString(),
      tokenOut.decimals,
    )

    return {
      amountOut,
      data: encodeFunctionData({
        abi: MOCK_SWAP_ABI,
        functionName: 'swap',
        args: [tokenIn.address, amountIn, tokenOut.address, amountOut],
      }),
    }
  }
  const { pathId, amountOut } = await fetchQuote({
    chainId,
    amountIn,
    tokenIn,
    tokenOut,
    slippageLimitPercent,
    userAddress,
  })

  const { transaction } = await fetchOdosApi<{
    transaction: {
      data: `0x${string}`
      gas: number
      value: string
      to: string
      from: string
      nonce: number
      gasPrice: bigint
    }
  }>('sor/assemble', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify({
      pathId,
      simulate: false,
      userAddr: userAddress,
    }),
  })
  return {
    amountOut,
    data: transaction.data,
  }
}
