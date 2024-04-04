import { getAddress } from 'viem'

import { CHAIN_IDS } from './chain'

export const CONTRACT_ADDRESSES: {
  [chain in CHAIN_IDS]: {
    Controller: `0x${string}`
    BookManager: `0x${string}`
  }
} = {
  [CHAIN_IDS.ARBITRUM_SEPOLIA]: {
    Controller: getAddress('0x2489e8daffb7A4900074840C24e8096A25e2Eeb0'),
    BookManager: getAddress('0x6411E5f824E1386d62ea20bFE5d815933F7E8491'),
  },
}
