import { getAddress, PublicClient } from 'viem'

import { CHAIN_IDS, Currency } from '../../src'
import { CONTRACT_ADDRESSES } from '../../src/constants/addresses'
import { fetchCurrencyMap } from '../../src/entities/currency/apis'
import { fromOrderId } from '../../src/entities/open-order/utils/order-id.ts'

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
  publicClient: PublicClient,
  chainId: CHAIN_IDS,
  orderIds: bigint[],
): Promise<
  {
    open: bigint
    claimable: bigint
    orderId: bigint
    unit: bigint
    tick: bigint
    owner: `0x${string}`
    baseCurrency: Currency
    quoteCurrency: Currency
  }[]
> => {
  const result = await publicClient.multicall({
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
    const { base, quote, unit } = result[index + orderIds.length * 2]
      .result as {
      base: `0x${string}`
      quote: `0x${string}`
      unit: bigint
    }
    return {
      open: order.open,
      claimable: order.claimable,
      orderId,
      owner,
      unit,
      tick: fromOrderId(orderId).tick,
      baseCurrency: currencyMap[getAddress(base)],
      quoteCurrency: currencyMap[getAddress(quote)],
    }
  })
}
