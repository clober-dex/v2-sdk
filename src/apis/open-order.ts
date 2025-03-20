import { formatUnits, getAddress, isAddressEqual, zeroAddress } from 'viem'

import { CHAIN_IDS } from '../constants/chain'
import { getMarketId } from '../utils/market'
import type { Currency } from '../model/currency'
import { baseToQuote, quoteToBase } from '../utils/decimals'
import { formatPrice } from '../utils/prices'
import { invertTick, toPrice } from '../utils/tick'
import type { OpenOrder, OpenOrderDto } from '../model/open-order'
import { applyPercent } from '../utils/bigint'
import { MAKER_DEFAULT_POLICY } from '../constants/fee'
import { Subgraph } from '../constants/subgraph'
import { NATIVE_CURRENCY } from '../constants/currency'

const getOpenOrderFromSubgraph = async (
  chainId: CHAIN_IDS,
  orderId: string,
) => {
  return Subgraph.get<{
    data: {
      openOrder: OpenOrderDto | null
    }
  }>(
    chainId,
    'getOpenOrder',
    'query getOpenOrder($orderId: ID!) { openOrder(id: $orderId) { id user book { id base { id name symbol decimals } quote { id name symbol decimals } unitSize } tick txHash createdAt unitAmount unitFilledAmount unitClaimedAmount unitClaimableAmount orderIndex } }',
    {
      orderId,
    },
  )
}

const getOpenOrdersFromSubgraph = async (
  chainId: CHAIN_IDS,
  orderIds: string[],
) => {
  return Subgraph.get<{
    data: {
      openOrders: OpenOrderDto[]
    }
  }>(
    chainId,
    'getOpenOrders',
    'query getOpenOrders($orderIds: [ID!]!) { openOrders(where: {id_in: $orderIds}) { id user book { id base { id name symbol decimals } quote { id name symbol decimals } unitSize } tick txHash createdAt unitAmount unitFilledAmount unitClaimedAmount unitClaimableAmount orderIndex } }',
    {
      orderIds,
    },
  )
}

const getOpenOrdersByUserAddressFromSubgraph = async (
  chainId: CHAIN_IDS,
  userAddress: `0x${string}`,
) => {
  return Subgraph.get<{
    data: {
      openOrders: OpenOrderDto[]
    }
  }>(
    chainId,
    'getOpenOrdersByUserAddress',
    'query getOpenOrdersByUserAddress($userAddress: String!) { openOrders(where: { user: $userAddress }, first: 1000) { id user book { id base { id name symbol decimals } quote { id name symbol decimals } unitSize } tick txHash createdAt unitAmount unitFilledAmount unitClaimedAmount unitClaimableAmount orderIndex } }',
    {
      userAddress: userAddress.toLowerCase(),
    },
  )
}

export async function fetchOpenOrdersByUserAddressFromSubgraph(
  chainId: CHAIN_IDS,
  userAddress: `0x${string}`,
): Promise<OpenOrder[]> {
  const {
    data: { openOrders },
  } = await getOpenOrdersByUserAddressFromSubgraph(chainId, userAddress)
  const currencies = getCurrenciesFromOpenOrderDtos(chainId, openOrders)
  return openOrders.map((openOrder) =>
    toOpenOrder(chainId, currencies, openOrder),
  )
}

export async function fetchOpenOrderByOrderIdFromSubgraph(
  chainId: CHAIN_IDS,
  orderId: string,
): Promise<OpenOrder> {
  const {
    data: { openOrder },
  } = await getOpenOrderFromSubgraph(chainId, orderId)
  if (!openOrder) {
    throw new Error(`Open order not found: ${orderId}`)
  }
  return toOpenOrder(
    chainId,
    getCurrenciesFromOpenOrderDtos(chainId, [openOrder]),
    openOrder,
  )
}

export async function fetchOpenOrdersByOrderIdsFromSubgraph(
  chainId: CHAIN_IDS,
  orderIds: string[],
): Promise<OpenOrder[]> {
  const {
    data: { openOrders },
  } = await getOpenOrdersFromSubgraph(chainId, orderIds)
  const currencies = getCurrenciesFromOpenOrderDtos(chainId, openOrders)
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
  const quote = isBid ? inputCurrency : outputCurrency
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
    price: formatPrice(
      toPrice(isBid ? tick : invertTick(tick)),
      quote.decimals,
      base.decimals,
    ),
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

const getCurrenciesFromOpenOrderDtos = (
  chainId: CHAIN_IDS,
  openOrders: OpenOrderDto[],
): Currency[] => {
  const currencies = openOrders
    .map((openOrder) => {
      return [
        {
          address: getAddress(openOrder.book.base.id),
          name: openOrder.book.base.name,
          symbol: openOrder.book.base.symbol,
          decimals: Number(openOrder.book.base.decimals),
        },
        {
          address: getAddress(openOrder.book.quote.id),
          name: openOrder.book.quote.name,
          symbol: openOrder.book.quote.symbol,
          decimals: Number(openOrder.book.quote.decimals),
        },
      ]
    })
    .flat()
    // remove duplicates
    .filter(
      (currency, index, self) =>
        self.findIndex((c) => isAddressEqual(c.address, currency.address)) ===
        index,
    )
    // remove zero address
    .filter((currency) => !isAddressEqual(currency.address, zeroAddress))
  return [...currencies, NATIVE_CURRENCY[chainId]]
}
