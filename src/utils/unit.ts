import { createPublicClient, http, isAddressEqual, zeroAddress } from 'viem'

import { Currency } from '../model/currency'
import { CHAIN_IDS, CHAIN_MAP } from '../constants/chain'

const _abi = [
  {
    inputs: [],
    name: 'totalSupply',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const

export const calculateUnit = async (chainId: CHAIN_IDS, quote: Currency) => {
  if (isAddressEqual(quote.address, zeroAddress)) {
    return 10n ** 12n
  }
  const publicClient = createPublicClient({
    chain: CHAIN_MAP[chainId],
    transport: http(),
  })
  const totalSupply = await publicClient.readContract({
    address: quote.address,
    abi: _abi,
    functionName: 'totalSupply',
  })
  return (
    10n **
    BigInt(totalSupply <= 2n ** 64n ? 0n : Math.max(quote.decimals - 6, 0))
  )
}
