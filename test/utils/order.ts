import { isAddressEqual, PublicClient, TransactionReceipt } from 'viem'
import { CHAIN_IDS, Currency, getContractAddresses } from '@clober/v2-sdk'

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

export const getOpenOrderIdFromReceipt = ({
  chainId,
  receipt,
}: {
  chainId: CHAIN_IDS
  receipt: TransactionReceipt
}): bigint | null => {
  const log = receipt.logs.find(
    (log) =>
      isAddressEqual(
        log.address,
        getContractAddresses({ chainId }).BookManager,
      ) &&
      log.topics.length >= 4 &&
      log.topics[0] ===
        '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef', // Transfer event
  )
  if (!log) {
    return null
  }
  return BigInt(log.topics[3]!) // The order ID is in the 4th topic
}

export const getOpenOrders = async ({
  publicClient,
  orderIds,
}: {
  publicClient: PublicClient
  orderIds: bigint[]
}): Promise<
  {
    open: bigint
    claimable: bigint
    orderId: bigint
    owner: `0x${string}`
    provider: `0x${string}`
  }[]
> => {
  const result = await publicClient.multicall({
    contracts: [
      ...orderIds.map((orderId) => ({
        address: getContractAddresses({ chainId: publicClient.chain!.id })
          .BookManager,
        abi: [
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
        ] as const,
        functionName: 'getOrder',
        args: [orderId],
      })),
      ...orderIds.map((orderId) => ({
        address: getContractAddresses({ chainId: publicClient.chain!.id })
          .BookManager,
        abi: [
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
        ] as const,
        functionName: 'ownerOf',
        args: [orderId],
      })),
    ],
  })
  return orderIds.map((orderId, index) => {
    const order = result[index].result as {
      provider: `0x${string}`
      open: bigint
      claimable: bigint
    }
    const owner = result[index + orderIds.length].result as `0x${string}`
    return {
      open: order.open,
      claimable: order.claimable,
      orderId,
      owner,
      provider: order.provider,
    }
  })
}
