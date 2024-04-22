import { getAddress, isAddressEqual, zeroAddress } from 'viem'

import type { Currency } from '../model/currency'
import { CHAIN_IDS } from '../constants/chain'
import { cachedPublicClients } from '../constants/client'

const _abi = [
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
  chainId: CHAIN_IDS,
  address: `0x${string}`,
): Promise<Currency> => {
  const cachedCurrency = getCurrencyFromCache(chainId, address)
  if (cachedCurrency) {
    return cachedCurrency
  }

  const currency = await fetchCurrencyInner(chainId, address)
  setCurrencyToCache(chainId, address, currency)
  return currency
}

export const fetchCurrencyMap = async (
  chainId: CHAIN_IDS,
  addresses: `0x${string}`[],
): Promise<{
  [address: `0x${string}`]: Currency
}> => {
  addresses = addresses
    .filter((address) => !isAddressEqual(address, zeroAddress))
    .filter((address, index, self) => self.indexOf(address) === index)
  const cachedCurrencies = addresses
    .map((address) => getCurrencyFromCache(chainId, address))
    .filter((currency) => currency !== undefined) as Currency[]
  const uncachedAddresses = addresses.filter(
    (address) =>
      !cachedCurrencies.some((currency) => currency.address === address),
  )
  const uncachedCurrencies = await fetchCurrencyMapInner(
    chainId,
    uncachedAddresses,
  )
  for (const currency of Object.values(uncachedCurrencies)) {
    setCurrencyToCache(chainId, currency.address, currency)
  }

  return {
    ...cachedCurrencies.reduce(
      (acc, currency) => {
        acc[getAddress(currency.address)] = currency
        return acc
      },
      {} as {
        [address: `0x${string}`]: Currency
      },
    ),
    ...uncachedCurrencies,
    [zeroAddress as `0x${string}`]: {
      address: zeroAddress,
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
    } as Currency,
  }
}

const fetchCurrencyInner = async (
  chainId: CHAIN_IDS,
  address: `0x${string}`,
): Promise<Currency> => {
  if (isAddressEqual(address, zeroAddress)) {
    return {
      address: zeroAddress,
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
    }
  }

  const [{ result: name }, { result: symbol }, { result: decimals }] =
    await cachedPublicClients[chainId].multicall({
      contracts: [
        {
          address,
          abi: _abi,
          functionName: 'name',
        },
        {
          address,
          abi: _abi,
          functionName: 'symbol',
        },
        {
          address,
          abi: _abi,
          functionName: 'decimals',
        },
      ],
    })
  return {
    address,
    name: name ?? 'Unknown',
    symbol: symbol ?? 'Unknown',
    decimals: decimals ?? 18,
  }
}

const fetchCurrencyMapInner = async (
  chainId: CHAIN_IDS,
  addresses: `0x${string}`[],
): Promise<{
  [address: `0x${string}`]: Currency
}> => {
  addresses = addresses
    .filter((address) => !isAddressEqual(address, zeroAddress))
    .filter((address, index, self) => self.indexOf(address) === index)

  if (addresses.length === 0) {
    return {}
  }

  const result = await cachedPublicClients[chainId]!.multicall({
    contracts: [
      ...addresses.map((address) => ({
        address,
        abi: _abi,
        functionName: 'name',
      })),
      ...addresses.map((address) => ({
        address,
        abi: _abi,
        functionName: 'symbol',
      })),
      ...addresses.map((address) => ({
        address,
        abi: _abi,
        functionName: 'decimals',
      })),
    ],
  })

  return addresses
    .map((address, index) => {
      const name = result[index].result as string | undefined
      const symbol = result[index + addresses.length].result as
        | string
        | undefined
      const decimals = result[index + addresses.length * 2].result as
        | number
        | undefined
      return {
        address,
        name: name ?? 'Unknown',
        symbol: symbol ?? 'Unknown',
        decimals: decimals ?? 18,
      }
    })
    .reduce(
      (acc, currency) => {
        acc[getAddress(currency.address)] = currency
        return acc
      },
      {} as {
        [address: `0x${string}`]: Currency
      },
    )
}
