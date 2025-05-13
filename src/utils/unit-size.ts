import { isAddressEqual, zeroAddress } from 'viem'

import { type Currency } from '../entities/currency/model'
import { CHAIN_IDS } from '../constants/chains'
import { WETH_ADDRESSES } from '../constants/currency'

export const calculateUnitSize = (chainId: CHAIN_IDS, quote: Currency) => {
  if (
    isAddressEqual(quote.address, zeroAddress) ||
    WETH_ADDRESSES[chainId].includes(quote.address)
  ) {
    return 10n ** 12n
  }
  return 10n ** BigInt(Math.max(quote.decimals - 6, 0))
}
