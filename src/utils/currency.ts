import { isAddressEqual, zeroAddress } from 'viem'

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

export const fetchCurrency = async (
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
