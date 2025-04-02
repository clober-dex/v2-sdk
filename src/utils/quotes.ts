import BigNumber from 'bignumber.js'

BigNumber.config({
  DECIMAL_PLACES: 100,
})

const PRICE_PRECISION = 18

export const quotes = (
  amountIn: bigint,
  inputCurrencyPrice: number,
  outputCurrencyPrice: number,
  inputCurrencyDecimals: number,
  outputCurrencyDecimals: number,
): bigint => {
  const bnPriceA = BigInt(
    new BigNumber(inputCurrencyPrice).times(10 ** PRICE_PRECISION).toFixed(0),
  )
  const bnPriceB = BigInt(
    new BigNumber(outputCurrencyPrice).times(10 ** PRICE_PRECISION).toFixed(0),
  )
  return (
    (amountIn * bnPriceA * 10n ** BigInt(outputCurrencyDecimals)) /
    (bnPriceB * 10n ** BigInt(inputCurrencyDecimals))
  )
}
