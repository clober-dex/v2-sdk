import { isAddressEqual, zeroAddress } from 'viem'

import { type Currency } from '../model/currency'
import { CHAIN_IDS } from '../constants/chain'
import { cachedPublicClients } from '../constants/client'

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

const buildCurrencyCacheKey = (chainId: CHAIN_IDS, address: `0x${string}`) =>
  `${chainId}:${address}`
const unitSizeCache = new Map<string, bigint>()
const getUnitFromCache = (
  chainId: CHAIN_IDS,
  address: `0x${string}`,
): bigint | undefined =>
  unitSizeCache.get(buildCurrencyCacheKey(chainId, address))
const setUnitSizeToCache = (
  chainId: CHAIN_IDS,
  address: `0x${string}`,
  unitSize: bigint,
) => unitSizeCache.set(buildCurrencyCacheKey(chainId, address), unitSize)

export const calculateUnitSize = async (
  chainId: CHAIN_IDS,
  quote: Currency,
) => {
  const cachedUnit = getUnitFromCache(chainId, quote.address)
  if (cachedUnit !== undefined) {
    return cachedUnit
  }
  const unitSize = await calculateUnitInner(chainId, quote)
  setUnitSizeToCache(chainId, quote.address, unitSize)
  return unitSize
}

const calculateUnitInner = async (chainId: CHAIN_IDS, quote: Currency) => {
  if (isAddressEqual(quote.address, zeroAddress)) {
    return 10n ** 12n
  }
  const totalSupply = await cachedPublicClients[chainId].readContract({
    address: quote.address,
    abi: _abi,
    functionName: 'totalSupply',
  })
  return (
    10n **
    BigInt(totalSupply <= 2n ** 64n ? 0n : Math.max(quote.decimals - 6, 0))
  )
}
