import { getAddress } from 'viem'

import { CHAIN_IDS } from './chain'

export const CONTRACT_ADDRESSES: {
  [chain in CHAIN_IDS]: {
    Controller: `0x${string}`
    BookManager: `0x${string}`
    BookViewer: `0x${string}`
  }
} = {
  [CHAIN_IDS.CLOBER_TESTNET]: {
    Controller: getAddress('0xfAe4A04fa491DC21F77796394532a1B62d8331BF'),
    BookManager: getAddress('0x4a4eaF7382821da4Fb85e8A8d515f5555383d58A'),
    BookViewer: getAddress('0xA7603C4c895a533E66c30EA76cC6F6A6A0c5cbFe'),
  },
  [CHAIN_IDS.ARBITRUM_SEPOLIA]: {
    Controller: getAddress('0x3e15fee68C06A0Cd3aF5430A665a9dd502C8544e'),
    BookManager: getAddress('0x3a90fbD5DbE4C82018A4Ac28406A50917dB91def'),
    BookViewer: getAddress('0x46f4661D64BCb4dE9AD5a2fAd7b49EBfC6c27caE'),
  },
  [CHAIN_IDS.BASE]: {
    Controller: getAddress('0x4ed2804b5409298290654D665619c7b092297dB2'),
    BookManager: getAddress('0x59fAD5b95e755034572702991ABBA937Cc90254a'),
    BookViewer: getAddress('0x0e7fc8F067470424589Cc25DceEd0dA9a1a8E72A'),
  },
  [CHAIN_IDS.BERACHAIN_TESTNET]: {
    Controller: getAddress('0x1Aa68597c14F3f950E2683fA7a975fc9CdAcC484'),
    BookManager: getAddress('0xA7e0051561D5b955F1014939FB54F71C7F4AEdF1'),
    BookViewer: getAddress('0xc0d74f9C1c27BC5EC195066863F4de7Ee1152998'),
  },
  [CHAIN_IDS.ZKSYNC_SEPOLIA]: {
    Controller: getAddress('0x43fE61b4Cae1E4b1D0D8789a06865793FaE0d57B'),
    BookManager: getAddress('0x50d2BaAe58D13757aFcA5a735CC1D2dDE1ceE0e5'),
    BookViewer: getAddress('0x930874edb90B0E2218EEc35330f9B8eBa5baA82a'),
  },
}
