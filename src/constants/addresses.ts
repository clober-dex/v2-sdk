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
    Controller: getAddress('0x014780652eE8Cb9A8D227757307aAE4656a794F5'),
    BookManager: getAddress('0xc47e4f2D113A51ABf0DaCEf6687FE0dBA70D09E6'),
    BookViewer: getAddress('0x06731177b4FA6dF2B14a714736828E373e3ae03b'),
  },
  [CHAIN_IDS.BERACHAIN_TESTNET]: {
    Controller: getAddress('0x1Aa68597c14F3f950E2683fA7a975fc9CdAcC484'),
    BookManager: getAddress('0xA7e0051561D5b955F1014939FB54F71C7F4AEdF1'),
    BookViewer: getAddress('0xc0d74f9C1c27BC5EC195066863F4de7Ee1152998'),
  },
  [CHAIN_IDS.ZKSYNC]: {
    Controller: getAddress('0x46D949cb444feF1a1BF63767F513f5091de6b5f5'),
    BookManager: getAddress('0x5961268BFd6b057c3ffA4709eDb920bD97011B13'),
    BookViewer: getAddress('0x7D206e3A8B785Dce75Bc755772Bd9eacdC77F5A9'),
  },
  [CHAIN_IDS.ZKSYNC_SEPOLIA]: {
    Controller: getAddress('0x6d29603bFd8989B7A8F4E8751d34afC4fDa4e001'),
    BookManager: getAddress('0x419DD5a4e74f96e57C1F8B8B46ae6855395A9de7'),
    BookViewer: getAddress('0xb5C640837f944Ef8A48468A789c0dF52D3F147b1'),
  },
}
