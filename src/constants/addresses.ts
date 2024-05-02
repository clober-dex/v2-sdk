import { getAddress } from 'viem'

import { CHAIN_IDS } from './chain'

export const CONTRACT_ADDRESSES: {
  [chain in CHAIN_IDS]: {
    Controller: `0x${string}`
    BookManager: `0x${string}`
    BookViewer: `0x${string}`
  }
} = {
  [CHAIN_IDS.ARBITRUM_SEPOLIA]: {
    Controller: getAddress('0x3e15fee68C06A0Cd3aF5430A665a9dd502C8544e'),
    BookManager: getAddress('0x4a4eaF7382821da4Fb85e8A8d515f5555383d58A'),
    BookViewer: getAddress('0x46f4661D64BCb4dE9AD5a2fAd7b49EBfC6c27caE'),
  },
  [CHAIN_IDS.BASE]: {
    Controller: getAddress('0x4ed2804b5409298290654D665619c7b092297dB2'),
    BookManager: getAddress('0x59fAD5b95e755034572702991ABBA937Cc90254a'),
    BookViewer: getAddress('0x0e7fc8F067470424589Cc25DceEd0dA9a1a8E72A'),
  },
  [CHAIN_IDS.BERACHAIN_TESTNET]: {
    Controller: getAddress('0x2EF0F04fbA5bCa42cC9569f4f2E3A4D11f182600'),
    BookManager: getAddress('0x982c57388101D012846aDC4997E9b073F3bC16BD'),
    BookViewer: getAddress('0x16CF06ECB016e449c57b94B8368f2d45D5cf343D'),
  },
  [CHAIN_IDS.ZKSYNC_SEPOLIA]: {
    Controller: getAddress('0xBc3F57AB4046a5C47997e0791C2D664aA3fa0574'),
    BookManager: getAddress('0xd95424eEDC5a9Da8378d762B0620FDD9ae457AE2'),
    BookViewer: getAddress('0x4E52Bb3Ce586C33adbf6DB24d32277b75A25ae0e'),
  },
}
