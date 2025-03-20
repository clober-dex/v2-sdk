import { formatUnits, getAddress, isAddressEqual, PublicClient } from 'viem'

import { CHAIN_IDS, getMarketPrice } from '../index'
import { CONTRACT_ADDRESSES } from '../constants/addresses'
import { MAKER_DEFAULT_POLICY } from '../constants/fee'
import { BOOK_MANAGER_ABI } from '../abis/core/book-manager-abi'
import { OnChainOpenOrder } from '../model/open-order'

import { fetchCurrencyMap } from './currency'
import { quoteToBase } from './decimals'
import { getMarketId } from './market'
import { applyPercent } from './bigint'

export const fetchOnChainOrders = async (
  publicClient: PublicClient,
  chainId: CHAIN_IDS,
  orderIds: bigint[],
): Promise<OnChainOpenOrder[]> => {
  const result = await publicClient.multicall({
    contracts: [
      ...orderIds.map((orderId) => ({
        address: CONTRACT_ADDRESSES[chainId]!.BookManager,
        abi: BOOK_MANAGER_ABI,
        functionName: 'getOrder',
        args: [orderId],
      })),
      ...orderIds.map((orderId) => ({
        address: CONTRACT_ADDRESSES[chainId]!.BookManager,
        abi: BOOK_MANAGER_ABI,
        functionName: 'ownerOf',
        args: [orderId],
      })),
      ...orderIds.map((orderId) => ({
        address: CONTRACT_ADDRESSES[chainId]!.BookManager,
        abi: BOOK_MANAGER_ABI,
        functionName: 'getBookKey',
        args: [fromOrderId(orderId).bookId],
      })),
    ],
  })
  const addresses = orderIds
    .map((_, index) => {
      const { base, quote } = result[index + orderIds.length * 2].result as {
        base: `0x${string}`
        quote: `0x${string}`
      }
      return [base, quote]
    })
    .flat()
  const currencyMap = await fetchCurrencyMap(publicClient, chainId, addresses)

  return orderIds.map((orderId, index) => {
    const order = result[index].result as {
      provider: `0x${string}`
      open: bigint
      claimable: bigint
    }
    const owner = result[index + orderIds.length].result as `0x${string}`
    const { base, quote, unitSize } = result[index + orderIds.length * 2]
      .result as {
      base: `0x${string}`
      quote: `0x${string}`
      unitSize: bigint
    }
    const cancelable = applyPercent(
      unitSize * order.open,
      100 +
        (Number(MAKER_DEFAULT_POLICY[chainId].rate) * 100) /
          Number(MAKER_DEFAULT_POLICY[chainId].RATE_PRECISION),
      6,
    )
    const claimable = quoteToBase(
      fromOrderId(orderId).tick,
      unitSize * order.claimable,
      false,
    )
    const isBid = isAddressEqual(
      quote,
      getMarketId(chainId, [base, quote]).quoteTokenAddress,
    )
    const { tick, index: orderIndex } = fromOrderId(orderId)
    const [quoteCurrency, baseCurrency] = isBid
      ? [currencyMap[quote], currencyMap[base]]
      : [currencyMap[base], currencyMap[quote]]
    return {
      id: orderId.toString(),
      user: owner,
      isBid,
      price: isBid
        ? getMarketPrice({
            marketQuoteCurrency: quoteCurrency,
            marketBaseCurrency: baseCurrency,
            bidTick: tick,
          })
        : getMarketPrice({
            marketQuoteCurrency: quoteCurrency,
            marketBaseCurrency: baseCurrency,
            askTick: tick,
          }),
      tick: Number(tick),
      orderIndex: orderIndex.toString(),
      inputCurrency: currencyMap[getAddress(quote)],
      outputCurrency: currencyMap[getAddress(base)],
      cancelable: {
        currency: currencyMap[getAddress(quote)],
        value: formatUnits(cancelable, currencyMap[getAddress(quote)].decimals),
      },
      claimable: {
        currency: currencyMap[getAddress(base)],
        value: formatUnits(claimable, currencyMap[getAddress(base)].decimals),
      },
    }
  })
}

export const fromOrderId = (
  orderId: bigint,
): {
  bookId: bigint
  tick: bigint
  index: bigint
} => {
  const tick = (orderId >> 40n) & (2n ** 24n - 1n)
  return {
    bookId: orderId >> 64n,
    tick: tick & (2n ** 23n) ? -(2n ** 24n - tick) : tick,
    index: orderId & (2n ** 40n - 1n),
  }
}
