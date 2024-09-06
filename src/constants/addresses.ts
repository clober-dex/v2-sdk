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
    Controller: getAddress('0xFbbA685a39bE6640B8EB08c6E6DDf2664fD1D668'),
    BookManager: getAddress('0xC528b9ED5d56d1D0d3C18A2342954CE1069138a4'),
    BookViewer: getAddress('0x73c524e103C94Bf2743659d739586395B1A9e1BE'),
    Rebalancer: getAddress('0x4Ba00c2849D993279AD30E1618C73d6db4c64ACe'),
    Strategy: getAddress('0x49cD6E6cFBB0B022f2389FaC4b0889CdBC26dc11'),
    Minter: getAddress('0x852Ce4B5448F95A7D091393B5bbc159d16fb291a'),
    Operator: getAddress('0xEEE4F3b484787bd28aa0e790b4ab92660e7ecd06'),
  },
  [CHAIN_IDS.BASE]: {
    Controller: getAddress('0x57dDD0d3DF50685444442076AC59F9c7Df75D150'),
    BookManager: getAddress('0x382CCccbD3b142D7DA063bF68cd0c89634767F76'),
    BookViewer: getAddress('0xcAf89a60D0911AeB8C2b997B5eF9b2017a19Be0d'),
    Rebalancer: zeroAddress,
    Strategy: zeroAddress,
    Minter: zeroAddress,
    Operator: zeroAddress,
  },
  [CHAIN_IDS.BERACHAIN_TESTNET]: {
    Controller: getAddress('0x1A0E22870dE507c140B7C765a04fCCd429B8343F'),
    BookManager: getAddress('0x874b1B795993653fbFC3f1c1fc0469214cC9F4A5'),
    BookViewer: getAddress('0x5C91A02B8B5D10597fc6cA23faF56F9718D1feD0'),
    Rebalancer: zeroAddress,
    Strategy: zeroAddress,
    Minter: zeroAddress,
    Operator: zeroAddress,
  },
  [CHAIN_IDS.ZKSYNC]: {
    Controller: getAddress('0xC6DFb3CCE884b283460dB0fB0e33335EeF7cdD57'),
    BookManager: getAddress('0xAaA0e933e1EcC812fc075A81c116Aa0a82A5bbb8'),
    BookViewer: getAddress('0x8CA1585D798cBC121139E3809e340c41D1762723'),
    Rebalancer: zeroAddress,
    Strategy: zeroAddress,
    Minter: zeroAddress,
    Operator: zeroAddress,
  },
}
