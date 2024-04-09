import { getAddress } from 'viem'

import { CHAIN_IDS } from './chain'

export const CONTRACT_ADDRESSES: {
  [chain in CHAIN_IDS]: {
    Controller: `0x${string}`
    BookManager: `0x${string}`
  }
} = {
  [CHAIN_IDS.CLOBER_TEST_CHAIN]: {
    Controller: getAddress('0x2489e8daffb7A4900074840C24e8096A25e2Eeb0'),
    BookManager: getAddress('0x6411E5f824E1386d62ea20bFE5d815933F7E8491'),
  },
  [CHAIN_IDS.ARBITRUM_SEPOLIA]: {
    Controller: getAddress('0xfAe4A04fa491DC21F77796394532a1B62d8331BF'),
    BookManager: getAddress('0x4a4eaF7382821da4Fb85e8A8d515f5555383d58A'),
  },
}
