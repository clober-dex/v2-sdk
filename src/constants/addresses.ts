import { getAddress, zeroAddress } from 'viem'

import { CHAIN_IDS } from './chain'

export const CONTRACT_ADDRESSES: {
  [chain in CHAIN_IDS]: {
    Controller: `0x${string}`
    BookManager: `0x${string}`
    BookViewer: `0x${string}`
    Rebalancer: `0x${string}`
    Strategy: `0x${string}`
    Minter: `0x${string}`
    Operator: `0x${string}`
  }
} = {
  [CHAIN_IDS.CLOBER_TESTNET]: {
    Controller: getAddress('0xfAe4A04fa491DC21F77796394532a1B62d8331BF'),
    BookManager: getAddress('0x4a4eaF7382821da4Fb85e8A8d515f5555383d58A'),
    BookViewer: getAddress('0xA7603C4c895a533E66c30EA76cC6F6A6A0c5cbFe'),
    Rebalancer: getAddress('0x4Ba00c2849D993279AD30E1618C73d6db4c64ACe'),
    Strategy: getAddress('0x49cD6E6cFBB0B022f2389FaC4b0889CdBC26dc11'),
    Minter: getAddress('0x852Ce4B5448F95A7D091393B5bbc159d16fb291a'),
    Operator: getAddress('0xEEE4F3b484787bd28aa0e790b4ab92660e7ecd06'),
  },
  [CHAIN_IDS.ARBITRUM_SEPOLIA]: {
    Controller: getAddress('0x91101543D3Bd3e919dAd034Bf978ef9d87290993'),
    BookManager: getAddress('0xC528b9ED5d56d1D0d3C18A2342954CE1069138a4'),
    BookViewer: getAddress('0x73c524e103C94Bf2743659d739586395B1A9e1BE'),
    Rebalancer: getAddress('0x4Ba00c2849D993279AD30E1618C73d6db4c64ACe'),
    Strategy: getAddress('0x49cD6E6cFBB0B022f2389FaC4b0889CdBC26dc11'),
    Minter: getAddress('0x852Ce4B5448F95A7D091393B5bbc159d16fb291a'),
    Operator: getAddress('0xEEE4F3b484787bd28aa0e790b4ab92660e7ecd06'),
  },
  [CHAIN_IDS.BASE]: {
    Controller: getAddress('0x4FaC849f948E59f9AEB62d9f7E628138DeF03BfA'),
    BookManager: getAddress('0x382CCccbD3b142D7DA063bF68cd0c89634767F76'),
    BookViewer: getAddress('0xcAf89a60D0911AeB8C2b997B5eF9b2017a19Be0d'),
    Rebalancer: zeroAddress,
    Strategy: zeroAddress,
    Minter: zeroAddress,
    Operator: zeroAddress,
  },
  [CHAIN_IDS.BERACHAIN_TESTNET]: {
    Controller: getAddress('0x1Aa68597c14F3f950E2683fA7a975fc9CdAcC484'),
    BookManager: getAddress('0xA7e0051561D5b955F1014939FB54F71C7F4AEdF1'),
    BookViewer: getAddress('0xc0d74f9C1c27BC5EC195066863F4de7Ee1152998'),
    Rebalancer: zeroAddress,
    Strategy: zeroAddress,
    Minter: zeroAddress,
    Operator: zeroAddress,
  },
  [CHAIN_IDS.ZKSYNC]: {
    Controller: getAddress('0x11BB911a7F0EE10d4cEB569f3D7d6b741dEbdfcc'),
    BookManager: getAddress('0xAaA0e933e1EcC812fc075A81c116Aa0a82A5bbb8'),
    BookViewer: getAddress('0xc1925FaeB02aD934e000B4698367C9B9eAd0b666'),
    Rebalancer: zeroAddress,
    Strategy: zeroAddress,
    Minter: zeroAddress,
    Operator: zeroAddress,
  },
}
