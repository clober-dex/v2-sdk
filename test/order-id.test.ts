import { expect, test } from 'vitest'
import { createPublicClient, http } from 'viem'
import { arbitrumSepolia } from 'viem/chains'
import { getOpenOrders } from '@clober/v2-sdk'

import { fromOrderId } from '../src/utils/order'
import { cloberTestChain } from '../src/constants/test-chain'

import { FORK_URL } from './utils/constants'

const _abi = [
  {
    inputs: [
      {
        internalType: 'OrderId',
        name: 'id',
        type: 'uint256',
      },
    ],
    name: 'decode',
    outputs: [
      {
        internalType: 'BookId',
        name: 'bookId',
        type: 'uint192',
      },
      {
        internalType: 'Tick',
        name: 'tick',
        type: 'int24',
      },
      {
        internalType: 'uint40',
        name: 'index',
        type: 'uint40',
      },
    ],
    stateMutability: 'pure',
    type: 'function',
  },
] as const

const ORDER_ID_WRAPPER_ADDRESS = '0xE6F891AB0cEE5b3Cc2fc1888D7A244eCc5bC1129'

const publicClient = createPublicClient({
  chain: arbitrumSepolia,
  transport: http(FORK_URL),
})

test('check fromOrderId function', async () => {
  const openOrders = await getOpenOrders({
    chainId: cloberTestChain.id,
    userAddress: '0x000000000000000000000000000000000000dead',
  })
  for (const openOrder of openOrders) {
    const result = await publicClient.readContract({
      address: ORDER_ID_WRAPPER_ADDRESS,
      abi: _abi,
      functionName: 'decode',
      args: [BigInt(openOrder.id)],
    })
    const { bookId, tick, index } = fromOrderId(BigInt(openOrder.id))
    expect(result[0]).toEqual(bookId)
    expect(result[1]).toEqual(Number(tick))
    expect(result[2]).toEqual(Number(index))
  }
})
