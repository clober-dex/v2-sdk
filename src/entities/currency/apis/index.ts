import { getAddress, isAddressEqual, PublicClient, zeroAddress } from 'viem'

import type { Currency } from '../types'
import { CHAIN_IDS } from '../../../constants/chain-configs/chain'
import { ETH, NATIVE_CURRENCY } from '../../../constants/chain-configs/currency'
import { Subgraph } from '../../../constants/chain-configs/subgraph'

const abi = [
  {
    inputs: [],
    name: 'name',
    outputs: [
      {
        internalType: 'string',
        name: '',
        type: 'string',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'symbol',
    outputs: [
      {
        internalType: 'string',
        name: '',
        type: 'string',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'decimals',
    outputs: [
      {
        internalType: 'uint8',
        name: '',
        type: 'uint8',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const

const buildCurrencyCacheKey = (chainId: CHAIN_IDS, address: `0x${string}`) =>
  `${chainId}:${address}`
const currencyCache = new Map<string, Currency>()
const getCurrencyFromCache = (
  chainId: CHAIN_IDS,
  address: `0x${string}`,
): Currency | undefined =>
  currencyCache.get(buildCurrencyCacheKey(chainId, address))
const setCurrencyToCache = (
  chainId: CHAIN_IDS,
  address: `0x${string}`,
  currency: Currency,
) => currencyCache.set(buildCurrencyCacheKey(chainId, address), currency)

export const fetchCurrency = async (
  publicClient: PublicClient,
  chainId: CHAIN_IDS,
  address: `0x${string}`,
): Promise<Currency> => {
  const cached = getCurrencyFromCache(chainId, address)
  if (cached) {
    return cached
  }

  const currency = await fetchCurrencyInner(publicClient, address)
  setCurrencyToCache(chainId, address, currency)
  return currency
}

export const fetchCurrencyMap = async (
  publicClient: PublicClient,
  chainId: CHAIN_IDS,
  addresses: `0x${string}`[],
  useSubgraph: boolean,
): Promise<Record<`0x${string}`, Currency>> => {
  const unique = Array.from(
    new Set(addresses.filter((a) => !isAddressEqual(a, zeroAddress))),
  )

  const cached = unique
    .map((address) => getCurrencyFromCache(chainId, address))
    .filter((c): c is Currency => c !== undefined)

  const uncached = unique.filter(
    (a) => !cached.some((c) => isAddressEqual(c.address, a)),
  )

  const fetched = await fetchCurrencyMapInner(
    publicClient,
    chainId,
    uncached,
    useSubgraph,
  )

  for (const currency of fetched) {
    setCurrencyToCache(chainId, currency.address, currency)
  }

  return {
    ...Object.fromEntries(cached.map((c) => [getAddress(c.address), c])),
    ...Object.fromEntries(fetched.map((c) => [getAddress(c.address), c])),
    [zeroAddress]: NATIVE_CURRENCY[chainId],
  }
}

const fetchCurrencyInner = async (
  publicClient: PublicClient,
  address: `0x${string}`,
): Promise<Currency> => {
  if (isAddressEqual(address, zeroAddress)) {
    return publicClient.chain ? NATIVE_CURRENCY[publicClient.chain.id] : ETH
  }

  const [{ result: name }, { result: symbol }, { result: decimals }] =
    await publicClient.multicall({
      contracts: [
        { address, abi, functionName: 'name' },
        { address, abi, functionName: 'symbol' },
        { address, abi, functionName: 'decimals' },
      ],
    })
  if (!name || !symbol || !decimals) {
    throw new Error(`Failed to fetch currency: ${address}`)
  }
  return { address, name, symbol, decimals }
}

const fetchCurrencyMapInner = async (
  publicClient: PublicClient,
  chainId: CHAIN_IDS,
  addresses: `0x${string}`[],
  useSubgraph: boolean,
): Promise<Currency[]> => {
  const unique = Array.from(
    new Set(addresses.filter((a) => !isAddressEqual(a, zeroAddress))),
  )

  if (unique.length === 0) {
    return []
  }

  if (useSubgraph) {
    const {
      data: { tokens },
    } = await Subgraph.get<{
      data: {
        tokens: {
          id: string
          name: string
          symbol: string
          decimals: string
        }[]
      }
    }>(
      chainId,
      'getTokens',
      'query getTokens($addresses: [Bytes!]!) { tokens(where: {id_in: $addresses}) { id name symbol decimals } }',
      {
        addresses: unique.map((a) => a.toLowerCase()),
      },
    )

    return tokens.map((token) => ({
      address: getAddress(token.id),
      name: token.name,
      symbol: token.symbol,
      decimals: Number(token.decimals),
    }))
  }

  const result = await publicClient.multicall({
    contracts: [
      ...unique.map((a) => ({ address: a, abi, functionName: 'name' })),
      ...unique.map((a) => ({ address: a, abi, functionName: 'symbol' })),
      ...unique.map((a) => ({ address: a, abi, functionName: 'decimals' })),
    ],
  })

  return unique.map((address, i) => {
    const name = result[i].result as string | undefined
    const symbol = result[i + unique.length].result as string | undefined
    const decimals = result[i + unique.length * 2].result as number | undefined

    if (!name || !symbol || !decimals) {
      throw new Error(`Failed to fetch currency: ${address}`)
    }

    return { address, name, symbol, decimals }
  })
}
