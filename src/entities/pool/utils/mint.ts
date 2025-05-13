import BigNumber from 'bignumber.js'

import { Currency } from '../../currency/types'

export const toBytes32 = (value: `0x${string}`): `0x${string}` => {
  return `0x${value.slice(2, 66).padStart(64, '0')}`
}

// @dev: This function is ported from the contract code
export function getExpectedMintResult(
  totalSupply: bigint,
  liquidityA: bigint,
  liquidityB: bigint,
  amountA: bigint,
  amountB: bigint,
  currencyA: Currency,
  currencyB: Currency,
): {
  mintAmount: bigint
  inAmountA: bigint
  inAmountB: bigint
} {
  if (totalSupply === 0n) {
    if (amountA === 0n || amountB === 0n) {
      return {
        mintAmount: 0n,
        inAmountA: 0n,
        inAmountB: 0n,
      }
    }
    const complementA = BigInt(10 ** (18 - currencyA.decimals))
    const complementB = BigInt(10 ** (18 - currencyB.decimals))
    const _amountA = amountA * complementA
    const _amountB = amountB * complementB
    return {
      mintAmount: _amountA > _amountB ? _amountA : _amountB,
      inAmountA: amountA,
      inAmountB: amountB,
    }
  } else {
    if (liquidityA === 0n && liquidityB === 0n) {
      return {
        mintAmount: 0n,
        inAmountA: 0n,
        inAmountB: 0n,
      }
    } else if (liquidityA === 0n) {
      return {
        mintAmount: (amountB * totalSupply) / liquidityB,
        inAmountA: 0n,
        inAmountB: amountB,
      }
    } else if (liquidityB === 0n) {
      return {
        mintAmount: (amountA * totalSupply) / liquidityA,
        inAmountA: amountA,
        inAmountB: 0n,
      }
    } else {
      const mintA = (amountA * totalSupply) / liquidityA
      const mintB = (amountB * totalSupply) / liquidityB
      if (mintA > mintB) {
        return {
          mintAmount: mintB,
          inAmountA: (liquidityA * mintB) / totalSupply,
          inAmountB: amountB,
        }
      } else {
        return {
          mintAmount: mintA,
          inAmountA: amountA,
          inAmountB: (liquidityB * mintA) / totalSupply,
        }
      }
    }
  }
}

export function getIdealDelta(
  amountA: bigint,
  amountB: bigint,
  liquidityA: bigint,
  liquidityB: bigint,
  swapAmountA: bigint,
  swapAmountB: bigint,
): {
  deltaA: bigint
  deltaB: bigint
} {
  if (swapAmountA === 0n || swapAmountB === 0n) {
    throw new Error('Invalid swap amount information')
  }
  if (liquidityA === 0n && liquidityB === 0n) {
    return {
      deltaA: 0n,
      deltaB: 0n,
    }
  } else {
    const deltaA =
      ((liquidityA * amountB - liquidityB * amountA) * swapAmountA) /
      (swapAmountA * liquidityB + swapAmountB * liquidityA)
    const deltaB =
      -((liquidityA * amountB - liquidityB * amountA) * swapAmountB) /
      (swapAmountA * liquidityB + swapAmountB * liquidityA)
    return {
      deltaA,
      deltaB,
    }
  }
}

export const getQuoteAmountFromPrices = (
  amountIn: bigint,
  inputCurrencyPrice: number,
  outputCurrencyPrice: number,
  inputCurrencyDecimals: number,
  outputCurrencyDecimals: number,
): bigint => {
  const priceA = BigInt(
    new BigNumber(inputCurrencyPrice).times(10 ** 18).toFixed(0),
  )
  const priceB = BigInt(
    new BigNumber(outputCurrencyPrice).times(10 ** 18).toFixed(0),
  )
  return (
    (amountIn * priceA * 10n ** BigInt(outputCurrencyDecimals)) /
    (priceB * 10n ** BigInt(inputCurrencyDecimals))
  )
}
