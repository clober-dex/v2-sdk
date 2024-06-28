import { formatUnits, getAddress, isAddressEqual } from 'viem'

import { CHAIN_IDS } from '../constants/chain'
import { getMarketId } from '../utils/market'
import type { Currency } from '../model/currency'
import { baseToQuote, quoteToBase } from '../utils/decimals'
import { formatPrice } from '../utils/prices'
import { invertTick } from '../utils/tick'
import type { OpenOrder, OpenOrderDto } from '../model/open-order'
import { fetchCurrency } from '../utils/currency'
import { applyPercent } from '../utils/bigint'
import { MAKER_DEFAULT_POLICY } from '../constants/fee'
import { cachedSubgraph } from '../constants/subgraph'

const getOpenOrder = async (chainId: CHAIN_IDS, orderId: string) => {
  return cachedSubgraph[chainId]!.get<{
    data: {
      openOrder: OpenOrderDto | null
    }
  }>(
    'getOpenOrder',
    'query getOpenOrder($orderId: ID!) { openOrder(id: $orderId) { id user book { id base { id name symbol decimals } quote { id name symbol decimals } unitSize } tick txHash createdAt unitAmount unitFilledAmount unitClaimedAmount unitClaimableAmount orderIndex } }',
    {
      orderId,
    },
  )
}

const getOpenOrders = async (chainId: CHAIN_IDS, orderIds: string[]) => {
  return cachedSubgraph[chainId]!.get<{
    data: {
      openOrders: OpenOrderDto[]
    }
  }>(
    'getOpenOrders',
    'query getOpenOrders($orderIds: [ID!]!) { openOrders(where: {id_in: $orderIds}) { id user book { id base { id name symbol decimals } quote { id name symbol decimals } unitSize } tick txHash createdAt unitAmount unitFilledAmount unitClaimedAmount unitClaimableAmount orderIndex } }',
    {
      orderIds,
    },
  )
}

const getOpenOrdersByUserAddress = async (
  chainId: CHAIN_IDS,
  userAddress: `0x${string}`,
) => {
  return cachedSubgraph[chainId]!.get<{
    data: {
      openOrders: OpenOrderDto[]
    }
  }>(
    'getOpenOrdersByUserAddress',
    'query getOpenOrdersByUserAddress($userAddress: String!) { openOrders(where: { user: $userAddress }) { id user book { id base { id name symbol decimals } quote { id name symbol decimals } unitSize } tick txHash createdAt unitAmount unitFilledAmount unitClaimedAmount unitClaimableAmount orderIndex } }',
    {
      userAddress: userAddress.toLowerCase(),
    },
  )
}

export async function fetchOpenOrdersByUserAddress(
  chainId: CHAIN_IDS,
  userAddress: `0x${string}`,
): Promise<OpenOrder[]> {
  const {
    data: { openOrders },
  } = await getOpenOrdersByUserAddress(chainId, userAddress)
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

export async function fetchOpenOrders(
  chainId: CHAIN_IDS,
  ids: string[],
): Promise<OpenOrder[]> {
  const {
    data: { openOrders },
  } = await getOpenOrders(chainId, ids)
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
  const base = isBid ? outputCurrency : inputCurrency
  const tick = BigInt(openOrder.tick)
  const unitAmount = BigInt(openOrder.unitAmount)
  const unitFilledAmount = BigInt(openOrder.unitFilledAmount)
  const unitSize = BigInt(openOrder.book.unitSize)
  const unitClaimedAmount = BigInt(openOrder.unitClaimedAmount)
  const unitClaimableAmount = BigInt(openOrder.unitClaimableAmount)

  // base amount type
  const amount = isBid
    ? quoteToBase(tick, unitSize * unitAmount, false)
    : unitSize * unitAmount
  const filled = isBid
    ? quoteToBase(tick, unitSize * unitFilledAmount, false)
    : unitSize * unitFilledAmount

  // each currency amount type
  const invertedTick = invertTick(tick)
  const claimed = isBid
    ? quoteToBase(tick, unitSize * unitClaimedAmount, false)
    : baseToQuote(invertedTick, unitSize * unitClaimedAmount, false)
  const claimable = isBid
    ? quoteToBase(tick, unitSize * unitClaimableAmount, false)
    : baseToQuote(invertedTick, unitSize * unitClaimableAmount, false)

  const cancelable = unitSize * (unitAmount - unitFilledAmount) // same current open amount
  return {
    id: openOrder.id,
    user: getAddress(openOrder.user),
    isBid,
    inputCurrency,
    outputCurrency,
    txHash: openOrder.txHash as `0x${string}`,
    createdAt: Number(openOrder.createdAt),
    price: formatPrice(isBid ? tick : invertTick(tick)),
    tick: Number(tick),
    orderIndex: openOrder.orderIndex,
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
      value: formatUnits(
        applyPercent(
          cancelable,
          100 +
            (Number(MAKER_DEFAULT_POLICY[chainId].rate) * 100) /
              Number(MAKER_DEFAULT_POLICY[chainId].RATE_PRECISION),
          6,
        ),
        inputCurrency.decimals,
      ),
    },
  }
}
