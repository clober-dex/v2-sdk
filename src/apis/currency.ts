import { createPublicClient, http, isAddressEqual, zeroAddress } from 'viem'

import type { Currency } from '../model/currency'
import { CHAIN_IDS, CHAIN_MAP } from '../constants/chain'

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
  rpcUrl?: string,
): Promise<Currency> => {
  if (isAddressEqual(address, zeroAddress)) {
    return {
      address: zeroAddress,
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
    }
  }

  const publicClient = createPublicClient({
    chain: CHAIN_MAP[chainId],
    transport: rpcUrl ? http(rpcUrl) : http(),
  })
  const [{ result: name }, { result: symbol }, { result: decimals }] =
    await publicClient.multicall({
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
