import { PublicClient, zeroAddress, isAddressEqual } from 'viem'

import { NATIVE_CURRENCY_TOTAL_SUPPLY } from '../../../constants/chain-configs/currency'

const abi = [
  {
    name: 'totalSupply',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    inputs: [],
    stateMutability: 'view',
    type: 'function',
  },
] as const

const totalSupplyCache = new Map<string, bigint>()

const buildCacheKey = (chainId: number, address: `0x${string}`) =>
  `${chainId}:${address}`

const getFromCache = (chainId: number, address: `0x${string}`) =>
  totalSupplyCache.get(buildCacheKey(chainId, address))

const setToCache = (chainId: number, address: `0x${string}`, value: bigint) =>
  totalSupplyCache.set(buildCacheKey(chainId, address), value)

export const fetchTotalSupply = async (
  publicClient: PublicClient,
  chainId: number,
  address: `0x${string}`,
): Promise<bigint> => {
  if (isAddressEqual(address, zeroAddress)) {
    return NATIVE_CURRENCY_TOTAL_SUPPLY[chainId]
  }

  const cached = getFromCache(chainId, address)
  if (cached !== undefined) {
    return cached
  }

  const result = await publicClient.readContract({
    address,
    abi,
    functionName: 'totalSupply',
  })

  setToCache(chainId, address, result)
  return result
}

export const fetchTotalSupplyMap = async (
  publicClient: PublicClient,
  chainId: number,
  addresses: `0x${string}`[],
): Promise<{ [address: `0x${string}`]: bigint }> => {
  const unique = Array.from(
    new Set(addresses.filter((a) => !isAddressEqual(a, zeroAddress))),
  )

  const cached = Object.fromEntries(
    unique
      .map((address) => {
        const value = getFromCache(chainId, address)
        return value !== undefined ? [address, value] : null
      })
      .filter(Boolean) as [string, bigint][],
  )

  const toFetch = unique.filter((a) => !(a in cached))

  const results =
    toFetch.length > 0
      ? await publicClient.multicall({
          contracts: toFetch.map((address) => ({
            address,
            abi,
            functionName: 'totalSupply',
          })),
        })
      : []

  const fetched = Object.fromEntries(
    results.map((r, i) => {
      const address = toFetch[i]
      const result = r.result as bigint | undefined
      if (!result) {
        throw new Error(`Failed to fetch totalSupply for ${address}`)
      }
      setToCache(chainId, address, result)
      return [address, result]
    }),
  )

  return {
    ...cached,
    ...fetched,
    [zeroAddress as `0x${string}`]: NATIVE_CURRENCY_TOTAL_SUPPLY[chainId],
  }
}
