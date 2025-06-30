import {
  createPublicClient,
  formatUnits,
  getAddress,
  http,
  isAddressEqual,
  parseUnits,
  zeroAddress,
} from 'viem'

import { CHAIN_IDS, CHAIN_MAP } from '../../constants/chain-configs/chain'
import {
  Currency,
  Currency6909Flow,
  CurrencyFlow,
  DefaultWriteContractOptions,
  ERC20PermitParam,
  Transaction,
} from '../../types'
import { fetchPool } from '../../entities/pool/apis'
import { EMPTY_ERC20_PERMIT_PARAMS } from '../../constants/permit'
import {
  getExpectedMintResult,
  getIdealDelta,
  getQuoteAmountFromPrices,
} from '../../entities/pool/utils/mint'
import { applyPercent } from '../../utils/bigint'
import { buildTransaction } from '../../utils/build-transaction'
import { CONTRACT_ADDRESSES } from '../../constants/chain-configs/addresses'
import { MINTER_ABI } from '../../constants/abis/rebalancer/minter-abi'
import { abs } from '../../utils/math'
import { fromOrderId } from '../../entities/open-order/utils/order-id'
import { formatPrice, invertTick, toPrice } from '../../utils'

const getBestQuote = async ({
  quotes,
  tokenIn,
  tokenOut,
  amountIn,
  slippageLimitPercent,
  gasPrice,
  userAddress,
}: {
  quotes: ((
    inputCurrency: Currency,
    amountIn: bigint,
    outputCurrency: Currency,
    slippageLimitPercent: number,
    gasPrice: bigint,
    userAddress: `0x${string}`,
  ) => Promise<{
    amountOut: bigint
    transaction: Transaction | undefined
  }>)[]
  tokenIn: Currency
  tokenOut: Currency
  amountIn: bigint
  slippageLimitPercent: number
  gasPrice: bigint
  userAddress: `0x${string}`
}): Promise<{ amountOut: bigint; transaction: Transaction }> => {
  const results = (
    await Promise.allSettled(
      (quotes ?? []).map(async (quote) =>
        quote(
          tokenIn,
          amountIn,
          tokenOut,
          slippageLimitPercent,
          gasPrice,
          userAddress,
        ),
      ),
    )
  )
    .map((result) => (result.status === 'fulfilled' ? result.value : undefined))
    .filter(
      (
        quote,
      ): quote is {
        amountOut: bigint
        transaction: Transaction | undefined
      } => quote !== undefined && quote.amountOut > 0n,
    )
    .sort((a, b) => Number(b.amountOut - a.amountOut))

  if (results.length === 0) {
    throw new Error('No quotes available')
  }
  if (results[0].amountOut <= 0n) {
    throw new Error('No valid quotes found')
  }
  if (results[0].transaction === undefined) {
    throw new Error('No transaction found for the best quote')
  }
  return {
    amountOut: results[0].amountOut,
    transaction: results[0].transaction,
  }
}

export const addLiquidity = async ({
  chainId,
  userAddress,
  token0,
  token1,
  salt,
  amount0,
  amount1,
  quotes,
  options,
}: {
  chainId: CHAIN_IDS
  userAddress: `0x${string}`
  token0: `0x${string}`
  token1: `0x${string}`
  salt: `0x${string}`
  amount0?: string
  amount1?: string
  quotes?: ((
    inputCurrency: Currency,
    amountIn: bigint,
    outputCurrency: Currency,
    slippageLimitPercent: number,
    gasPrice: bigint,
    userAddress: `0x${string}`,
  ) => Promise<{
    amountOut: bigint
    transaction: Transaction | undefined
  }>)[]
  options?: {
    slippage?: number
    disableSwap?: boolean
    token0PermitParams?: ERC20PermitParam
    token1PermitParams?: ERC20PermitParam
    useSubgraph?: boolean
  } & DefaultWriteContractOptions
}): Promise<{
  transaction: Transaction | undefined
  result: {
    currencyA: CurrencyFlow
    currencyB: CurrencyFlow
    lpCurrency: Currency6909Flow
  }
}> => {
  const publicClient = createPublicClient({
    chain: CHAIN_MAP[chainId],
    transport: options?.rpcUrl ? http(options.rpcUrl) : http(),
  })
  const pool = await fetchPool(
    publicClient,
    chainId,
    [token0, token1],
    salt,
    !!(options && options.useSubgraph),
  )
  if (!pool.isOpened) {
    throw new Error(`
       Open the pool before adding liquidity.
       import { openPool } from '@clober/v2-sdk'

       const transaction = await openPool({
            chainId: ${chainId},
            token0: '${token0}',
            token1: '${token1}',
            salt: '0x0000000000000000000000000000000000000000000000000000000000000000',
       })
    `)
  }
  const [amountAOrigin, amountBOrigin] = isAddressEqual(
    pool.currencyA.address,
    getAddress(token0),
  )
    ? [
        parseUnits(amount0 ?? '0', pool.currencyA.decimals),
        parseUnits(amount1 ?? '0', pool.currencyB.decimals),
      ]
    : [
        parseUnits(amount1 ?? '0', pool.currencyA.decimals),
        parseUnits(amount0 ?? '0', pool.currencyB.decimals),
      ]
  let [amountA, amountB] = [amountAOrigin, amountBOrigin]
  const tokenAPermitParams = isAddressEqual(
    pool.currencyA.address,
    getAddress(token0),
  )
    ? options?.token0PermitParams ?? EMPTY_ERC20_PERMIT_PARAMS
    : options?.token1PermitParams ?? EMPTY_ERC20_PERMIT_PARAMS
  const tokenBPermitParams = isAddressEqual(
    pool.currencyA.address,
    getAddress(token0),
  )
    ? options?.token1PermitParams ?? EMPTY_ERC20_PERMIT_PARAMS
    : options?.token0PermitParams ?? EMPTY_ERC20_PERMIT_PARAMS
  let disableSwap = !!(options && options.disableSwap)
  if (
    pool.totalSupply === 0n ||
    (pool.liquidityA === 0n && pool.liquidityB === 0n)
  ) {
    disableSwap = true
  }
  const slippageLimitPercent = options?.slippage ?? 1.0

  const swapParams: {
    inCurrency: `0x${string}`
    amount: bigint
    data: string
  } = {
    inCurrency: zeroAddress,
    amount: 0n,
    data: '0x',
  }

  if (!disableSwap) {
    if (
      !(
        isAddressEqual(pool.currencyA.address, pool.market.quote.address) &&
        isAddressEqual(pool.currencyB.address, pool.market.base.address)
      )
    ) {
      throw new Error(
        'Cannot add liquidity to a pool with the same quote and base currencies',
      )
    }

    let tokenAPrice =
      pool.orderListA.length > 0
        ? Number(
            formatPrice(
              toPrice(fromOrderId(BigInt(pool.orderListA[0])).tick),
              pool.market.quote.decimals,
              pool.market.base.decimals,
            ),
          )
        : 0
    let tokenBPrice =
      pool.orderListB.length > 0
        ? Number(
            formatPrice(
              toPrice(invertTick(fromOrderId(BigInt(pool.orderListB[0])).tick)),
              pool.market.quote.decimals,
              pool.market.base.decimals,
            ),
          )
        : 0
    if (tokenAPrice === 0 && tokenBPrice === 0) {
      throw new Error('No orders in the pool, cannot add liquidity')
    } else if (tokenAPrice === 0 && tokenBPrice > 0) {
      tokenAPrice = tokenBPrice
    } else if (tokenAPrice > 0 && tokenBPrice === 0) {
      tokenBPrice = tokenAPrice
    }
    const price = (tokenAPrice + tokenBPrice) / 2

    const swapAmountA = parseUnits('1', pool.currencyA.decimals)
    const swapAmountB = getQuoteAmountFromPrices(
      swapAmountA,
      1,
      price,
      pool.currencyA.decimals,
      pool.currencyB.decimals,
    )
    if (swapAmountB === -1n) {
      throw new Error('Failed to fetch quote')
    }
    const { deltaA, deltaB } = getIdealDelta(
      amountA,
      amountB,
      pool.liquidityA,
      pool.liquidityB,
      swapAmountA,
      swapAmountB,
    )
    const gasPrice = await publicClient.getGasPrice()
    if (deltaA < 0n) {
      swapParams.inCurrency = pool.currencyA.address
      swapParams.amount = -deltaA

      const { amountOut: actualDeltaB, transaction } = await getBestQuote({
        quotes: quotes ?? [],
        tokenIn: pool.currencyA,
        tokenOut: pool.currencyB,
        amountIn: swapParams.amount,
        slippageLimitPercent,
        gasPrice,
        userAddress,
      })

      swapParams.data = transaction.data
      amountA += deltaA
      amountB += actualDeltaB
    } else if (deltaB < 0n) {
      swapParams.inCurrency = pool.currencyB.address
      swapParams.amount = -deltaB

      const { amountOut: actualDeltaA, transaction } = await getBestQuote({
        quotes: quotes ?? [],
        tokenIn: pool.currencyB,
        tokenOut: pool.currencyA,
        amountIn: swapParams.amount,
        slippageLimitPercent,
        gasPrice,
        userAddress,
      })

      swapParams.data = transaction.data
      amountA += actualDeltaA
      amountB += deltaB
    }
  }

  const { mintAmount, inAmountA, inAmountB } = getExpectedMintResult(
    pool.totalSupply,
    pool.liquidityA,
    pool.liquidityB,
    amountA,
    amountB,
    pool.currencyA,
    pool.currencyB,
  )

  if (mintAmount === 0n) {
    return {
      transaction: undefined,
      result: {
        currencyA: {
          currency: pool.currencyA,
          amount: '0',
          direction: 'in',
        },
        currencyB: {
          currency: pool.currencyB,
          amount: '0',
          direction: 'in',
        },
        lpCurrency: {
          currency: pool.lpCurrency,
          amount: '0',
          direction: 'out',
        },
      },
    }
  }

  const minMintAmount = applyPercent(mintAmount, 100 - slippageLimitPercent)

  const transaction = await buildTransaction(
    publicClient,
    {
      chain: CHAIN_MAP[chainId],
      account: userAddress,
      address: CONTRACT_ADDRESSES[chainId]!.Minter,
      abi: MINTER_ABI,
      functionName: 'mint',
      args: [
        pool.key,
        amountAOrigin,
        amountBOrigin,
        minMintAmount,
        {
          permitAmount: tokenAPermitParams.permitAmount,
          signature: tokenAPermitParams.signature,
        },
        {
          permitAmount: tokenBPermitParams.permitAmount,
          signature: tokenBPermitParams.signature,
        },
        swapParams,
      ],
      value: isAddressEqual(token0, zeroAddress)
        ? amountAOrigin
        : isAddressEqual(token1, zeroAddress)
          ? amountBOrigin
          : undefined,
    },
    options?.gasLimit,
  )

  const currencyARefund = amountA - inAmountA
  const currencyBRefund = amountB - inAmountB
  const currencyAResultAmount = amountAOrigin - currencyARefund
  const currencyBResultAmount = amountBOrigin - currencyBRefund

  return {
    transaction,
    result: {
      currencyA: {
        currency: pool.currencyA,
        amount: formatUnits(
          abs(currencyAResultAmount),
          pool.currencyA.decimals,
        ),
        direction: currencyAResultAmount >= 0 ? 'in' : 'out',
      },
      currencyB: {
        currency: pool.currencyB,
        amount: formatUnits(
          abs(currencyBResultAmount),
          pool.currencyB.decimals,
        ),
        direction: currencyBResultAmount >= 0 ? 'in' : 'out',
      },
      lpCurrency: {
        currency: pool.lpCurrency,
        amount: formatUnits(mintAmount, pool.lpCurrency.decimals),
        direction: 'out',
      },
    },
  }
}
