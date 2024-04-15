import { formatUnits, getAddress, isAddressEqual } from 'viem'

import { CHAIN_IDS } from '../constants/chain'
import { getMarketId } from '../utils/market'
import type { Currency } from '../model/currency'
import { quoteToBase } from '../utils/decimals'
import { formatPrice } from '../utils/prices'
import { invertPrice, toPrice } from '../utils/tick'
import type { OpenOrder, OpenOrderDto } from '../model/open-order'
import { fetchCurrency } from '../utils/currency'

import { fetchSubgraph } from './subgraph'

const getOpenOrder = async (chainId: CHAIN_IDS, orderId: string) => {
  return fetchSubgraph<{
    data: {
      openOrder: OpenOrderDto | null
    }
  }>(
    chainId,
    'getOpenOrder',
    'query getOpenOrder($orderId: ID!) { openOrder(id: $orderId) { id book { id base { id name symbol decimals } quote { id name symbol decimals } unit } tick txHash createdAt rawAmount rawFilledAmount rawClaimedAmount rawClaimableAmount } }',
    {
      orderId,
    },
  )
}

const getOpenOrders = async (
  chainId: CHAIN_IDS,
  userAddress: `0x${string}`,
) => {
  return fetchSubgraph<{
    data: {
      openOrders: OpenOrderDto[]
    }
  }>(
    chainId,
    'getOpenOrders',
    'query getOpenOrders($userAddress: String!) { openOrders(where: { user: $userAddress }) { id book { id base { id name symbol decimals } quote { id name symbol decimals } unit } tick txHash createdAt rawAmount rawFilledAmount rawClaimedAmount rawClaimableAmount } }',
    {
      userAddress: userAddress.toLowerCase(),
    },
  )
}

export async function fetchOpenOrders(
  chainId: CHAIN_IDS,
  userAddress: `0x${string}`,
): Promise<OpenOrder[]> {
  const {
    data: { openOrders },
  } = await getOpenOrders(chainId, userAddress)
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
  return openOrders.map((openOrder) =>
    toOpenOrder(chainId, currencies, openOrder),
  )
}

export async function fetchOpenOrder(
  chainId: CHAIN_IDS,
  id: string,
): Promise<OpenOrder> {
  const {
    data: { openOrder },
  } = await getOpenOrder(chainId, id)
  if (!openOrder) {
    throw new Error(`Open order not found: ${id}`)
  }
  const currencies = await Promise.all([
    fetchCurrency(chainId, getAddress(openOrder.book.base.id)),
    fetchCurrency(chainId, getAddress(openOrder.book.quote.id)),
  ])
  return toOpenOrder(chainId, currencies, openOrder)
}

const toOpenOrder = (
  chainId: CHAIN_IDS,
  currencies: Currency[],
  openOrder: OpenOrderDto,
): OpenOrder => {
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
  const cancelable = isBid
    ? unit * (rawAmount - rawFilledAmount)
    : quoteToBase(tick, unit * (rawAmount - rawFilledAmount), false)
  return {
    id: openOrder.id,
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
    cancelable: {
      currency: inputCurrency,
      value: formatUnits(cancelable, inputCurrency.decimals),
    },
  }
}
