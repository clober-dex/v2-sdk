import { getAddress, isAddressEqual, zeroAddress } from 'viem'

import {
  STABLE_COINS,
  REFERENCE_CURRENCY,
} from '../../../constants/chain-configs/currency'
import { CHAIN_IDS } from '../../../constants/chain-configs/chain'

export const getMarketId = (
  chainId: CHAIN_IDS,
  tokenAddresses: `0x${string}`[],
): {
  baseTokenAddress: `0x${string}`
  quoteTokenAddress: `0x${string}`
  marketId: string
} => {
  if (tokenAddresses.length !== 2) {
    throw new Error('Invalid token pair')
  }
  tokenAddresses = tokenAddresses.map((address) => getAddress(address)).sort()

  // include stable coin
  const stable = tokenAddresses.find((address) => {
    return STABLE_COINS[chainId]!.map(({ address }) =>
      getAddress(address),
    ).some((addresses) => addresses.includes(address))
  })
  if (stable) {
    const other = tokenAddresses.find(
      (address) => !isAddressEqual(address, stable),
    )!
    return {
      marketId: `${other}/${stable}`,
      quoteTokenAddress: stable,
      baseTokenAddress: other,
    }
  }

  // include eth
  const eth = tokenAddresses.find((address) =>
    isAddressEqual(address, zeroAddress),
  )
  if (eth) {
    const other = tokenAddresses.find(
      (address) => !isAddressEqual(address, zeroAddress),
    )!
    return {
      marketId: `${other}/${eth}`,
      quoteTokenAddress: eth,
      baseTokenAddress: other,
    }
  }

  // include weth
  const weth = tokenAddresses.find((address) =>
    isAddressEqual(address, REFERENCE_CURRENCY[chainId].address),
  )
  if (weth) {
    const other = tokenAddresses.find(
      (address) => !isAddressEqual(address, weth),
    )!
    return {
      marketId: `${other}/${weth}`,
      quoteTokenAddress: weth,
      baseTokenAddress: other,
    }
  }

  const _tokens = tokenAddresses.sort((a, b) => a.localeCompare(b))
  return {
    marketId: `${_tokens[0]}/${_tokens[1]}`,
    quoteTokenAddress: _tokens[0]!,
    baseTokenAddress: _tokens[1]!,
  }
}
