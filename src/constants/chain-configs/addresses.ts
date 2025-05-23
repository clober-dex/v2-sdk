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
    Controller: getAddress('0xE64aCE1bF550E57461cd4e24706633d7faC9D7b0'),
    BookManager: getAddress('0xAA9575d63dFC224b9583fC303dB3188C08d5C85A'),
    BookViewer: getAddress('0x3e22d091F90ae759733B7CB06a6f7b440d84a425'),
    Rebalancer: getAddress('0x30b4e9215322B5d0c290249126bCf96C2Ca8e948'),
    Strategy: getAddress('0x540488b54c8DE6e44Db7553c3A2C4ABEb09Fc69C'),
    Minter: getAddress('0x0b8361a2bbF853F5F6Aa0911a9d238d9CFDD9f1a'),
    Operator: getAddress('0xFa47E8dD8F04BF23b238900e754041123a6bc6e2'),
  },
  [CHAIN_IDS.ARBITRUM_SEPOLIA]: {
    Controller: getAddress('0xE64aCE1bF550E57461cd4e24706633d7faC9D7b0'),
    BookManager: getAddress('0xAA9575d63dFC224b9583fC303dB3188C08d5C85A'),
    BookViewer: getAddress('0x3e22d091F90ae759733B7CB06a6f7b440d84a425'),
    Rebalancer: getAddress('0x30b4e9215322B5d0c290249126bCf96C2Ca8e948'),
    Strategy: getAddress('0x540488b54c8DE6e44Db7553c3A2C4ABEb09Fc69C'),
    Minter: getAddress('0x0b8361a2bbF853F5F6Aa0911a9d238d9CFDD9f1a'),
    Operator: getAddress('0xFa47E8dD8F04BF23b238900e754041123a6bc6e2'),
  },
  // [CHAIN_IDS.BASE]: {
  //   Controller: getAddress('0xbA1BFFd18bF55D656cc755c6555661002bf440F2'),
  //   BookManager: getAddress('0x382CCccbD3b142D7DA063bF68cd0c89634767F76'),
  //   BookViewer: getAddress('0xbfb608D67340fa54bA31614C293750EeB573c795'),
  //   Rebalancer: getAddress('0xeA0E19fbca0D9D707f3dA10Ef846cC255B0aAdf3'),
  //   Strategy: getAddress('0x44E550089da3A49488794B3CB761288821B7e5E0'),
  //   Minter: getAddress('0xafBd8d66cd96b7A8188E27c61C1ec059c465CE36'),
  //   Operator: getAddress('0x1BCD69Ff770B5A8dc4355d781F6a09515F2ea797'),
  // },
  [CHAIN_IDS.BERACHAIN_MAINNET]: {
    Controller: getAddress('0x06731177b4FA6dF2B14a714736828E373e3ae03b'),
    BookManager: getAddress('0xDED58e263087f5B45d878BD9CF599B7A1a75D1E4'),
    BookViewer: getAddress('0x4abb86f499f53e2b1F52302b2Ba7BbB0a90a49A8'),
    Rebalancer: zeroAddress,
    Strategy: zeroAddress,
    Minter: zeroAddress,
    Operator: zeroAddress,
  },
  [CHAIN_IDS.MONAD_TESTNET]: {
    Controller: getAddress('0x08feDaACe14EB141E51282441b05182519D853D1'),
    BookManager: getAddress('0xAA9575d63dFC224b9583fC303dB3188C08d5C85A'),
    BookViewer: getAddress('0x3e22d091F90ae759733B7CB06a6f7b440d84a425'),
    Rebalancer: getAddress('0x6d8fa3025b6d6604309Ca257563CcA358c0CF1AA'),
    Strategy: getAddress('0x9eE708876804F9416B3C1a1aad0c016dee9DD804'),
    Minter: getAddress('0xAF9Ca76F6BB5bd2B18964A14Fc095455E2C2a099'),
    Operator: getAddress('0x4BB54bB9a42Fe787D1D1A2AAcF91C70b02e5553E'),
  },
  // [CHAIN_IDS.SONIC_MAINNET]: {
  //   Controller: getAddress('0x920F77AebF215E611ABACd0fd51A87F3927D05B8'),
  //   BookManager: getAddress('0xD4aD5Ed9E1436904624b6dB8B1BE31f36317C636'),
  //   BookViewer: getAddress('0xe81e78f946e34d13Dcb6fd46a78713E0FFDA5613'),
  //   Rebalancer: getAddress('0x46107Ec44112675689053b96aea2127fD952bd47'),
  //   Strategy: getAddress('0xdd30f831bEB51fBF33E3D579e5529d3B1495554f'),
  //   Minter: getAddress('0x466795C0EAe3C44A6dcbB6DB0534F7019E0803A7'),
  //   Operator: getAddress('0xF7E7285eBe537fDf1C1c4432aa1863721EaC9a09'),
  // },
  [CHAIN_IDS.RISE_SEPOLIA]: {
    Controller: getAddress('0x08feDaACe14EB141E51282441b05182519D853D1'),
    BookManager: getAddress('0xBc6eaFe723723DED3a411b6a1089a63bc5d73568'),
    BookViewer: getAddress('0x3e22d091F90ae759733B7CB06a6f7b440d84a425'),
    Rebalancer: getAddress('0x552E53700042e0446C896b1803d9399ba846cF83'),
    Strategy: getAddress('0xa3CC662732e4ae2a2e0156859B7Fbcd57936723c'),
    Minter: getAddress('0x30a5460B801CA79F74e2A4D3b83A34af5D45c6b3'),
    Operator: getAddress('0x8E6983D1fb8E953135413Ee538afF53F4D098eD7'),
  },
}
