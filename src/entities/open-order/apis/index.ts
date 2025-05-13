import {
  formatUnits,
  getAddress,
  isAddressEqual,
  PublicClient,
  zeroAddress,
} from 'viem'

import { CHAIN_IDS } from '../../../constants/chain-configs/chain'
import { getMarketId } from '../../market/utils/market-id'
import type { Currency } from '../../currency/model'
import { baseToQuote, quoteToBase } from '../../../utils/conversion'
import { formatPrice, getMarketPrice } from '../../../utils/prices'
import { invertTick, toPrice } from '../../../utils/tick'
import { applyPercent } from '../../../utils/bigint'
import { MAKER_DEFAULT_POLICY } from '../../../constants/chain-configs/fee'
import { Subgraph } from '../../../constants/chain-configs/subgraph'
import { NATIVE_CURRENCY } from '../../../constants/chain-configs/currency'
import { CONTRACT_ADDRESSES } from '../../../constants/chain-configs/addresses'
import { BOOK_MANAGER_ABI } from '../../../constants/abis/core/book-manager-abi'
import { fetchCurrencyMap } from '../../currency/apis'
import { fromOrderId } from '../utils/order-id'
import { OnChainOpenOrder } from '../model'
import type { OpenOrder } from '../model'

type OpenOrderDto = {
  id: string
  owner: string
  book: {
    id: string
    base: {
      id: string
      name: string
      symbol: string
      decimals: string
    }
    quote: {
      id: string
      name: string
      symbol: string
      decimals: string
    }
    unitSize: string
  }
  tick: string
  transaction: {
    id: string
  }
  timestamp: string
  unitAmount: string
  filledUnitAmount: string
  claimedUnitAmount: string
  claimableUnitAmount: string
  orderIndex: string
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
  const filledUnitAmount = BigInt(openOrder.filledUnitAmount)
  const unitSize = BigInt(openOrder.book.unitSize)
  const claimedUnitAmount = BigInt(openOrder.claimedUnitAmount)
  const claimableUnitAmount = BigInt(openOrder.claimableUnitAmount)

  // base amount type
  const amount = isBid
    ? quoteToBase(tick, unitSize * unitAmount, false)
    : unitSize * unitAmount
  const filled = isBid
    ? quoteToBase(tick, unitSize * filledUnitAmount, false)
    : unitSize * filledUnitAmount

  // each currency amount type
  const invertedTick = invertTick(tick)
  const claimed = isBid
    ? quoteToBase(tick, unitSize * claimedUnitAmount, false)
    : baseToQuote(invertedTick, unitSize * claimedUnitAmount, false)
  const claimable = isBid
    ? quoteToBase(tick, unitSize * claimableUnitAmount, false)
    : baseToQuote(invertedTick, unitSize * claimableUnitAmount, false)

  const cancelable = unitSize * (unitAmount - filledUnitAmount) // same current open amount
  return {
    id: openOrder.id,
    user: getAddress(openOrder.owner),
    isBid,
    inputCurrency,
    outputCurrency,
    txHash: openOrder.transaction.id as `0x${string}`,
    createdAt: Number(openOrder.timestamp),
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

const extractCurrenciesFromOpenOrders = (
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

export async function fetchOpenOrdersByUserAddressFromSubgraph(
  chainId: CHAIN_IDS,
  userAddress: `0x${string}`,
): Promise<OpenOrder[]> {
  const {
    data: { openOrders },
  } = await Subgraph.get<{
    data: {
      openOrders: OpenOrderDto[]
    }
  }>(
    chainId,
    'getOpenOrdersByUserAddress',
    'query getOpenOrdersByUserAddress($userAddress: String!) { openOrders(where: {owner: $userAddress}, first: 1000) { id owner book { id base { id name symbol decimals } quote { id name symbol decimals } unitSize } tick transaction { id } timestamp unitAmount filledUnitAmount claimedUnitAmount claimableUnitAmount orderIndex } }',
    {
      userAddress: userAddress.toLowerCase(),
    },
  )
  const currencies = extractCurrenciesFromOpenOrders(chainId, openOrders)
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
  } = await Subgraph.get<{
    data: {
      openOrder: OpenOrderDto | null
    }
  }>(
    chainId,
    'getOpenOrder',
    'query getOpenOrder($orderId: ID!) { openOrder(id: $orderId) { id owner book { id base { id name symbol decimals } quote { id name symbol decimals } unitSize } tick transaction { id } timestamp unitAmount filledUnitAmount claimedUnitAmount claimableUnitAmount orderIndex } }',
    {
      orderId,
    },
  )
  if (!openOrder) {
    throw new Error(`Open order not found: ${orderId}`)
  }
  return toOpenOrder(
    chainId,
    extractCurrenciesFromOpenOrders(chainId, [openOrder]),
    openOrder,
  )
}

export async function fetchOpenOrdersByOrderIdsFromSubgraph(
  chainId: CHAIN_IDS,
  orderIds: string[],
): Promise<OpenOrder[]> {
  const {
    data: { openOrders },
  } = await Subgraph.get<{
    data: {
      openOrders: OpenOrderDto[]
    }
  }>(
    chainId,
    'getOpenOrders',
    'query getOpenOrders($orderIds: [ID!]!) { openOrders(where: {id_in: $orderIds}) { id owner book { id base { id name symbol decimals } quote { id name symbol decimals } unitSize } tick transaction { id } timestamp unitAmount filledUnitAmount claimedUnitAmount claimableUnitAmount orderIndex } }',
    {
      orderIds,
    },
  )
  const currencies = extractCurrenciesFromOpenOrders(chainId, openOrders)
  return openOrders.map((openOrder) =>
    toOpenOrder(chainId, currencies, openOrder),
  )
}

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
  const currencyMap = await fetchCurrencyMap(
    publicClient,
    chainId,
    addresses,
    false,
  )

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
