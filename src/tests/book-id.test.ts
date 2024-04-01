import { expect, test } from 'vitest'
import { createPublicClient, http } from 'viem'
import { arbitrumSepolia } from 'viem/chains'

import { FeePolicy } from '../model/fee-policy'
import { BOOK_ID_WRAPPER_ABI } from '../abis/mock/book-id-wrapper-abi'
import { toBookId } from '../utils/book-id'

const BOOK_ID_WRAPPER_ADDRESS = '0x5C91A02B8B5D10597fc6cA23faF56F9718D1feD0'
const publicClient = createPublicClient({
  chain: arbitrumSepolia,
  transport: http(),
})

test('check toId function', async () => {
  const makerPolicy = new FeePolicy(true, 100n)
  const takerPolicy = new FeePolicy(true, 1000n)
  const bookKey = {
    base: '0x0000000000000000000000000000000000000001' as `0x${string}`,
    unit: 100n,
    quote: '0x0000000000000000000000000000000000000002' as `0x${string}`,
    makerPolicy: Number(makerPolicy.value),
    hooks: '0x0000000000000000000000000000000000000003' as `0x${string}`,
    takerPolicy: Number(takerPolicy.value),
  }
  const actual = await publicClient.readContract({
    address: BOOK_ID_WRAPPER_ADDRESS,
    abi: BOOK_ID_WRAPPER_ABI,
    functionName: 'toId',
    args: [bookKey],
  })
  const expected = toBookId({
    ...bookKey,
    makerPolicy,
    takerPolicy,
  })
  await expect(actual).toBe(expected)
})
