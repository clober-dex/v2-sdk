import { CHAIN_IDS } from '../../src'
import { cachedPublicClients } from '../../src/constants/client'
import { CONTRACT_ADDRESSES } from '../../src/constants/addresses'

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
] as const

export const fetchOpenOrders = async (
  chainId: CHAIN_IDS,
  orderIds: bigint[],
): Promise<
  {
    open: bigint
    claimable: bigint
    orderId: bigint
  }[]
> => {
  const result = await cachedPublicClients[chainId]!.multicall({
    contracts: orderIds.map((orderId) => ({
      address: CONTRACT_ADDRESSES[chainId]!.BookManager,
      abi: _abi,
      functionName: 'getOrder',
      args: [orderId],
    })),
  })
  return result.map(({ result }, index) => ({
    open: result!.open,
    claimable: result!.claimable,
    orderId: orderIds[index],
  }))
}
