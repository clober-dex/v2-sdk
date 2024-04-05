import { formatUnits, getAddress, isAddressEqual } from 'viem'

import { getBuiltGraphSDK } from '../.graphclient'
import { CHAIN_IDS } from '../constants/chain'
import { SUBGRAPH_URL } from '../constants/subgraph-url'
import { getMarketId } from '../utils/market'
import { Currency } from '../model/currency'
import { quoteToBase } from '../utils/decimals'
import { formatPrice } from '../utils/prices'
import { invertPrice, toPrice } from '../utils/tick'
import { OpenOrder } from '../model/open-order'

import { fetchCurrency } from './currency'

const { getOpenOrders } = getBuiltGraphSDK()

export async function fetchOpenOrders(
  chainId: CHAIN_IDS,
  userAddress: `0x${string}`,
): Promise<OpenOrder[]> {
  const { openOrders } = await getOpenOrders(
    {
      userAddress: userAddress.toLowerCase(),
    },
    {
      url: SUBGRAPH_URL[chainId],
    },
  )
  const currencies = await Promise.all(
    openOrders
      .map((openOrder) => [
        getAddress(openOrder.book.base.id),
        getAddress(openOrder.book.quote.id),
      ])
      .flat()
      .filter(
        (address, index, self) =>
          self.findIndex((c) => isAddressEqual(c, address)) === index,
      )
      .map((address) => fetchCurrency(chainId, address)),
  )
  return openOrders.map((openOrder) => {
    const inputCurrency = currencies.find((c: Currency) =>
      isAddressEqual(c.address, getAddress(openOrder.book.quote.id)),
    )!
    const outputCurrency = currencies.find((c: Currency) =>
      isAddressEqual(c.address, getAddress(openOrder.book.base.id)),
    )!
    const { quoteTokenAddress } = getMarketId(chainId, [
      inputCurrency.address,
      outputCurrency.address,
    ])
    const isBid = isAddressEqual(quoteTokenAddress, inputCurrency.address)
    const quote = isBid ? inputCurrency : outputCurrency
    const base = isBid ? outputCurrency : inputCurrency
    const tick = BigInt(openOrder.tick)
    const rawAmount = BigInt(openOrder.rawAmount)
    const rawFilledAmount = BigInt(openOrder.rawFilledAmount)
    const unit = BigInt(openOrder.book.unit)
    const quoteAmount = unit * rawAmount
    const rawClaimedAmount = BigInt(openOrder.rawClaimedAmount)
    const rawClaimableAmount = BigInt(openOrder.rawClaimableAmount)
    const amount = isBid ? quoteToBase(tick, quoteAmount, false) : quoteAmount
    const filled = isBid
      ? quoteToBase(tick, unit * rawFilledAmount, false)
      : unit * rawFilledAmount
    const claimed = quoteToBase(tick, unit * rawClaimedAmount, false)
    const claimable = quoteToBase(tick, unit * rawClaimableAmount, false)
    return {
      id: BigInt(openOrder.id),
      isBid,
      inputCurrency,
      outputCurrency,
      txHash: openOrder.txHash as `0x${string}`,
      createdAt: Number(openOrder.createdAt),
      price: formatPrice(
        isBid ? toPrice(tick) : invertPrice(toPrice(tick)),
        quote.decimals,
        base.decimals,
      ),
      amount: { currency: base, value: formatUnits(amount, base.decimals) },
      filled: { currency: base, value: formatUnits(filled, base.decimals) },
      claimed: {
        currency: outputCurrency,
        value: formatUnits(claimed, outputCurrency.decimals),
      },
      claimable: {
        currency: outputCurrency,
        value: formatUnits(claimable, outputCurrency.decimals),
      },
      cancelable: rawAmount > rawFilledAmount,
    }
  })
}
