import { formatUnits, getAddress, isAddressEqual, zeroAddress } from 'viem'

import { CHAIN_IDS, OpenOrder } from '../index'
import { cachedPublicClients } from '../constants/client'
import { CONTRACT_ADDRESSES } from '../constants/addresses'
import { cachedSubgraph } from '../constants/subgraph'
import { fetchOpenOrders } from '../apis/open-order'
import { MAKER_DEFAULT_POLICY } from '../constants/fee'

import { fetchCurrencyMap } from './currency'
import { quoteToBase } from './decimals'
import { getMarketId } from './market'
import { applyPercent } from './bigint'

const _abi = [
  {
    inputs: [
      {
        internalType: 'OrderId',
        name: 'id',
        type: 'uint256',
      },
    ],
    name: 'getOrder',
    outputs: [
      {
        components: [
          {
            internalType: 'address',
            name: 'provider',
            type: 'address',
          },
          {
            internalType: 'uint64',
            name: 'open',
            type: 'uint64',
          },
          {
            internalType: 'uint64',
            name: 'claimable',
            type: 'uint64',
          },
        ],
        internalType: 'struct IBookManager.OrderInfo',
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'tokenId',
        type: 'uint256',
      },
    ],
    name: 'ownerOf',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'BookId',
        name: 'id',
        type: 'uint192',
      },
    ],
    name: 'getBookKey',
    outputs: [
      {
        components: [
          {
            internalType: 'Currency',
            name: 'base',
            type: 'address',
          },
          {
            internalType: 'uint64',
            name: 'unit',
            type: 'uint64',
          },
          {
            internalType: 'Currency',
            name: 'quote',
            type: 'address',
          },
          {
            internalType: 'FeePolicy',
            name: 'makerPolicy',
            type: 'uint24',
          },
          {
            internalType: 'contract IHooks',
            name: 'hooks',
            type: 'address',
          },
          {
            internalType: 'FeePolicy',
            name: 'takerPolicy',
            type: 'uint24',
          },
        ],
        internalType: 'struct IBookManager.BookKey',
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const

export const fetchOrders = async (
  chainId: CHAIN_IDS,
  orderIds: bigint[],
): Promise<OpenOrder[]> => {
  if (cachedSubgraph[chainId]) {
    return fetchOpenOrders(
      chainId,
      orderIds.map((orderId) => orderId.toString()),
    )
  }

  const result = await cachedPublicClients[chainId]!.multicall({
    contracts: [
      ...orderIds.map((orderId) => ({
        address: CONTRACT_ADDRESSES[chainId]!.BookManager,
        abi: _abi,
        functionName: 'getOrder',
        args: [orderId],
      })),
      ...orderIds.map((orderId) => ({
        address: CONTRACT_ADDRESSES[chainId]!.BookManager,
        abi: _abi,
        functionName: 'ownerOf',
        args: [orderId],
      })),
      ...orderIds.map((orderId) => ({
        address: CONTRACT_ADDRESSES[chainId]!.BookManager,
        abi: _abi,
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
  const currencyMap = await fetchCurrencyMap(chainId, addresses)

  return orderIds.map((orderId, index) => {
    const order = result[index].result as {
      provider: `0x${string}`
      open: bigint
      claimable: bigint
    }
    const owner = result[index + orderIds.length].result as `0x${string}`
    const { base, quote, unit } = result[index + orderIds.length * 2]
      .result as {
      base: `0x${string}`
      quote: `0x${string}`
      unit: bigint
    }
    const cancelable = applyPercent(
      unit * order.open,
      100 +
        (Number(MAKER_DEFAULT_POLICY.rate) * 100) /
          Number(MAKER_DEFAULT_POLICY.RATE_PRECISION),
      6,
    )
    const claimable = quoteToBase(
      fromOrderId(orderId).tick,
      unit * order.claimable,
      false,
    )
    const isBid = isAddressEqual(
      quote,
      getMarketId(chainId, [base, quote]).quoteTokenAddress,
    )
    return {
      id: orderId.toString(),
      user: owner,
      isBid,
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
      // don't care about these fields
      txHash: '' as `0x${string}`,
      createdAt: 0,
      price: 0,
      amount: {
        currency: currencyMap[zeroAddress],
        value: '0',
      },
      filled: {
        currency: currencyMap[zeroAddress],
        value: '0',
      },
      claimed: {
        currency: currencyMap[zeroAddress],
        value: '0',
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
