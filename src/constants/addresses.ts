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
    Controller: getAddress('0x91101543D3Bd3e919dAd034Bf978ef9d87290993'),
    BookManager: getAddress('0xC528b9ED5d56d1D0d3C18A2342954CE1069138a4'),
    BookViewer: getAddress('0x73c524e103C94Bf2743659d739586395B1A9e1BE'),
  },
  [CHAIN_IDS.BASE]: {
    Controller: getAddress('0xA694fDd88E7FEE1f5EBF878153B68ADb2ce6EbbF'),
    BookManager: getAddress('0x382CCccbD3b142D7DA063bF68cd0c89634767F76'),
    BookViewer: getAddress('0xcAf89a60D0911AeB8C2b997B5eF9b2017a19Be0d'),
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
