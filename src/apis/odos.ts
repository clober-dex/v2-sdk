import { encodeFunctionData, formatUnits, parseUnits } from 'viem'

import { CHAIN_IDS, isTestnetChain } from '../constants/chain'
import { MOCK_SWAP_ABI } from '../abis/rebalancer/mock-swap-abi'

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
  tokenInDecimals,
  tokenOutDecimals,
}: {
  chainId: CHAIN_IDS
  amountIn: bigint
  tokenIn: `0x${string}`
  tokenOut: `0x${string}`
  slippageLimitPercent: number
  userAddress: string
  testnetPrice?: number // tokenOutAmount per tokenIn, for testnet chains only
  tokenInDecimals?: number // for testnet chains only
  tokenOutDecimals?: number // for testnet chains only
}): Promise<{
  amountOut: bigint
  pathId: string
}> {
  if (isTestnetChain(chainId)) {
    if (!testnetPrice || !tokenInDecimals || !tokenOutDecimals) {
      throw new Error(
        'Missing testnetPrice, tokenInDecimals, or tokenOutDecimals for testnet chain',
      )
    }

    return {
      amountOut: parseUnits(
        (
          Number(formatUnits(amountIn, tokenInDecimals)) * testnetPrice
        ).toFixed(),
        tokenOutDecimals,
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
          tokenAddress: tokenIn,
          amount: amountIn.toString(),
        },
      ],
      outputTokens: [
        {
          tokenAddress: tokenOut,
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
  tokenInDecimals,
  tokenOutDecimals,
}: {
  chainId: CHAIN_IDS
  amountIn: bigint
  tokenIn: `0x${string}`
  tokenOut: `0x${string}`
  slippageLimitPercent: number
  userAddress: string
  testnetPrice?: number // tokenOutAmount per tokenIn, for testnet chains only
  tokenInDecimals?: number // for testnet chains only
  tokenOutDecimals?: number // for testnet chains only
}): Promise<{
  amountOut: bigint
  data: `0x${string}`
}> {
  if (isTestnetChain(chainId)) {
    if (!testnetPrice || !tokenInDecimals || !tokenOutDecimals) {
      throw new Error(
        'Missing testnetPrice, tokenInDecimals, or tokenOutDecimals for testnet chain',
      )
    }

    const amountOut = parseUnits(
      (Number(formatUnits(amountIn, tokenInDecimals)) * testnetPrice).toFixed(),
      tokenOutDecimals,
    )

    return {
      amountOut,
      data: encodeFunctionData({
        abi: MOCK_SWAP_ABI,
        functionName: 'swap',
        args: [tokenIn, amountIn, tokenOut, amountOut],
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
