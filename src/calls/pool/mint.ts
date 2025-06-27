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

export const addLiquidity = async ({
  chainId,
  userAddress,
  token0,
  token1,
  salt,
  amount0,
  amount1,
  options,
}: {
  chainId: CHAIN_IDS
  userAddress: `0x${string}`
  token0: `0x${string}`
  token1: `0x${string}`
  salt: `0x${string}`
  amount0?: string
  amount1?: string
  options?: {
    slippage?: number
    disableSwap?: boolean
    token0PermitParams?: ERC20PermitParam
    token1PermitParams?: ERC20PermitParam
    token0Price?: number
    token1Price?: number
    testnetPrice?: number
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
  const [amountA, amountB] = [amountAOrigin, amountBOrigin]
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

    const swapAmountA = parseUnits('1', pool.currencyA.decimals)
    const swapAmountB = getQuoteAmountFromPrices(
      swapAmountA,
      tokenAPrice,
      tokenBPrice,
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

    if (deltaA < 0n) {
      swapParams.inCurrency = pool.currencyA.address
      swapParams.amount = -deltaA
      // const { amountOut: actualDeltaB, data: calldata } =
      //   await fetchOdosCallData({
      //     chainId,
      //     amountIn: swapParams.amount,
      //     tokenIn: pool.currencyA,
      //     tokenOut: pool.currencyB,
      //     slippageLimitPercent,
      //     userAddress: CONTRACT_ADDRESSES[chainId]!.Minter,
      //     testnetPrice: currencyBPerCurrencyA,
      //   })
      // swapParams.data = calldata
      // amountA += deltaA
      // amountB += actualDeltaB
    } else if (deltaB < 0n) {
      swapParams.inCurrency = pool.currencyB.address
      swapParams.amount = -deltaB
      // const { amountOut: actualDeltaA, data: calldata } =
      //   await fetchOdosCallData({
      //     chainId,
      //     amountIn: swapParams.amount,
      //     tokenIn: pool.currencyB,
      //     tokenOut: pool.currencyA,
      //     slippageLimitPercent,
      //     userAddress: CONTRACT_ADDRESSES[chainId]!.Minter,
      //     testnetPrice: currencyBPerCurrencyA
      //       ? 1 / currencyBPerCurrencyA
      //       : undefined,
      //   })
      // swapParams.data = calldata
      // amountA += actualDeltaA
      // amountB += deltaB
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
