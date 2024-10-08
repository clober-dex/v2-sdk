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
    Rebalancer: getAddress('0xCF556d850277BC579c99C0729F4E72e62C57D811'),
    Strategy: getAddress('0x8aDF62b0b6078EaE5a2D54e9e5DD2AA71F6748C4'),
    Minter: getAddress('0xF2f51B00C2e9b77F23fD66649bbabf8a025c39eF'),
    Operator: getAddress('0x33559576B062D08230b467ea7DC7Ce75aFcbdE92'),
  },
  [CHAIN_IDS.CLOBER_TESTNET_2]: {
    Controller: getAddress('0xFbbA685a39bE6640B8EB08c6E6DDf2664fD1D668'),
    BookManager: getAddress('0xC528b9ED5d56d1D0d3C18A2342954CE1069138a4'),
    BookViewer: getAddress('0x73c524e103C94Bf2743659d739586395B1A9e1BE'),
    Rebalancer: getAddress('0xCF556d850277BC579c99C0729F4E72e62C57D811'),
    Strategy: getAddress('0x8aDF62b0b6078EaE5a2D54e9e5DD2AA71F6748C4'),
    Minter: getAddress('0xF2f51B00C2e9b77F23fD66649bbabf8a025c39eF'),
    Operator: getAddress('0x33559576B062D08230b467ea7DC7Ce75aFcbdE92'),
  },
  [CHAIN_IDS.ARBITRUM_SEPOLIA]: {
    Controller: getAddress('0xFbbA685a39bE6640B8EB08c6E6DDf2664fD1D668'),
    BookManager: getAddress('0xC528b9ED5d56d1D0d3C18A2342954CE1069138a4'),
    BookViewer: getAddress('0x73c524e103C94Bf2743659d739586395B1A9e1BE'),
    Rebalancer: getAddress('0xCF556d850277BC579c99C0729F4E72e62C57D811'),
    Strategy: getAddress('0x8aDF62b0b6078EaE5a2D54e9e5DD2AA71F6748C4'),
    Minter: getAddress('0xF2f51B00C2e9b77F23fD66649bbabf8a025c39eF'),
    Operator: getAddress('0x33559576B062D08230b467ea7DC7Ce75aFcbdE92'),
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
    Controller: getAddress('0x7d06c636bA86BD1fc2C38B11F1e5701145CABc30'),
    BookManager: getAddress('0x874b1B795993653fbFC3f1c1fc0469214cC9F4A5'),
    BookViewer: getAddress('0x5C91A02B8B5D10597fc6cA23faF56F9718D1feD0'),
    Rebalancer: zeroAddress,
    Strategy: zeroAddress,
    Minter: zeroAddress,
    Operator: zeroAddress,
  },
  [CHAIN_IDS.ZKSYNC]: {
    Controller: getAddress('0x9aF80CC61AAd734604f139A53E22c56Cdbf9a158'),
    BookManager: getAddress('0xAc6AdB2727F99C309acd511D942c0b2812e03614'),
    BookViewer: getAddress('0x13E8F7b988013729EcF00b0A3F8e0E47915aA893'),
    Rebalancer: zeroAddress,
    Strategy: zeroAddress,
    Minter: zeroAddress,
    Operator: zeroAddress,
  },
}
