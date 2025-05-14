import { isAddressEqual, zeroAddress } from 'viem'

import { type Currency } from '../entities/currency/types'
import { CHAIN_IDS } from '../constants/chain-configs/chain'
import { WETH_ADDRESS } from '../constants/chain-configs/currency'

export const calculateUnitSize = (chainId: CHAIN_IDS, quote: Currency) => {
  if (
    isAddressEqual(quote.address, zeroAddress) ||
    isAddressEqual(quote.address, WETH_ADDRESS[chainId]!)
  ) {
    return 10n ** 12n
  }
  return 10n ** BigInt(Math.max(quote.decimals - 6, 0))
}
