import { formatUnits, getAddress, isAddressEqual, zeroAddress } from 'viem'

import { STABLE_COIN_ADDRESSES, WETH_ADDRESSES } from '../constants/currency'
import { CHAIN_IDS } from '../constants/chain'
import { Market as MarketModel } from '../model/market'
import { Market } from '../type'

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
    return STABLE_COIN_ADDRESSES[chainId]!.map((addresses) =>
      getAddress(addresses),
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
  const weth = tokenAddresses.find((address) => {
    return WETH_ADDRESSES[chainId]!.map((addresses) =>
      getAddress(addresses),
    ).some((addresses) => addresses.includes(address))
  })
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

export const buildMarket = (
  chainId: CHAIN_IDS,
  marketModel: MarketModel,
): Market => {
  return {
    chainId,
    quote: marketModel.quote,
    base: marketModel.base,
    makerFee: marketModel.makerFee,
    takerFee: marketModel.takerFee,
    bids: marketModel.bids.map(({ price, tick, baseAmount }) => ({
      price,
      tick: Number(tick),
      baseAmount: formatUnits(baseAmount, marketModel.base.decimals),
    })),
    bidBook: {
      id: marketModel.bidBook.id.toString(),
      base: marketModel.bidBook.base,
      unitSize: marketModel.bidBook.unitSize.toString(),
      quote: marketModel.bidBook.quote,
      isOpened: marketModel.bidBook.isOpened,
    },
    asks: marketModel.asks.map(({ price, tick, baseAmount }) => ({
      price,
      tick: Number(tick),
      baseAmount: formatUnits(baseAmount, marketModel.base.decimals),
    })),
    askBook: {
      id: marketModel.askBook.id.toString(),
      base: marketModel.askBook.base,
      unitSize: marketModel.askBook.unitSize.toString(),
      quote: marketModel.askBook.quote,
      isOpened: marketModel.askBook.isOpened,
    },
  }
}
