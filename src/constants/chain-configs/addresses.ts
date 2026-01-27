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
    Wrapped6909Factory: `0x${string}`
  }
} = {
  [CHAIN_IDS.CLOBER_TESTNET]: {
    Controller: getAddress('0x08feDaACe14EB141E51282441b05182519D853D1'),
    BookManager: getAddress('0xAA9575d63dFC224b9583fC303dB3188C08d5C85A'),
    BookViewer: getAddress('0x3e22d091F90ae759733B7CB06a6f7b440d84a425'),
    Rebalancer: getAddress('0x66cAF16C9f154a7d967D660812272cb83FFC3AA6'),
    Strategy: getAddress('0xd400FE4504052C7D6540Db19e6863BFd91c95521'),
    Minter: getAddress('0x4dEa6b2085463158B80192D567254F773BC0Aa78'),
    Operator: getAddress('0x32d70eF6BFb7055dAC25B1FC05f201cD055796C1'),
    Wrapped6909Factory: getAddress(
      '0x9050b0A12D92b8ba7369ecc87BcD04643Fa0CfDB',
    ),
  },
  [CHAIN_IDS.ARBITRUM_SEPOLIA]: {
    Controller: getAddress('0x08feDaACe14EB141E51282441b05182519D853D1'),
    BookManager: getAddress('0xAA9575d63dFC224b9583fC303dB3188C08d5C85A'),
    BookViewer: getAddress('0x3e22d091F90ae759733B7CB06a6f7b440d84a425'),
    Rebalancer: getAddress('0x66cAF16C9f154a7d967D660812272cb83FFC3AA6'),
    Strategy: getAddress('0xd400FE4504052C7D6540Db19e6863BFd91c95521'),
    Minter: getAddress('0x4dEa6b2085463158B80192D567254F773BC0Aa78'),
    Operator: getAddress('0x32d70eF6BFb7055dAC25B1FC05f201cD055796C1'),
    Wrapped6909Factory: getAddress(
      '0x9050b0A12D92b8ba7369ecc87BcD04643Fa0CfDB',
    ),
  },
  [CHAIN_IDS.BASE]: {
    Controller: getAddress('0x2610dc1f2e625e57f07b0ce17152b0f4c6520bca'),
    BookManager: getAddress('0x8ca3a6f4a6260661fcb9a25584c796a1fa380112'),
    BookViewer: getAddress('0xcd166f67f13c7d5c4b899fb1c980dceff278f029'),
    Rebalancer: getAddress('0xca1f6e4ae690d06e3bf943b9019c5ca060c0b834'),
    Strategy: getAddress('0x29e07197ccf70d0ac6cb0a3c307627819f5f2777'),
    Minter: getAddress('0x2092a58c47f3444c82871ecdd5ea1e96c80c59d1'),
    Operator: getAddress('0x00f7a0c7e66f0e3a10d9e980e0854ebe0e308625'),
    Wrapped6909Factory: getAddress(
      '0x9050b0A12D92b8ba7369ecc87BcD04643Fa0CfDB',
    ),
  },
  [CHAIN_IDS.BERACHAIN_MAINNET]: {
    Controller: getAddress('0x06731177b4FA6dF2B14a714736828E373e3ae03b'),
    BookManager: getAddress('0xDED58e263087f5B45d878BD9CF599B7A1a75D1E4'),
    BookViewer: getAddress('0x4abb86f499f53e2b1F52302b2Ba7BbB0a90a49A8'),
    Rebalancer: zeroAddress,
    Strategy: zeroAddress,
    Minter: zeroAddress,
    Operator: zeroAddress,
    Wrapped6909Factory: getAddress(
      '0x0000000000000000000000000000000000000000',
    ),
  },
  [CHAIN_IDS.MONAD_TESTNET]: {
    Controller: getAddress('0x08feDaACe14EB141E51282441b05182519D853D1'),
    BookManager: getAddress('0xAA9575d63dFC224b9583fC303dB3188C08d5C85A'),
    BookViewer: getAddress('0x3e22d091F90ae759733B7CB06a6f7b440d84a425'),
    Rebalancer: getAddress('0x6d8fa3025b6d6604309Ca257563CcA358c0CF1AA'),
    Strategy: getAddress('0x9eE708876804F9416B3C1a1aad0c016dee9DD804'),
    Minter: getAddress('0x56B40a9517223f111441E58E865eBb3FB3898f42'),
    Operator: getAddress('0x4BB54bB9a42Fe787D1D1A2AAcF91C70b02e5553E'),
    Wrapped6909Factory: getAddress(
      '0x9050b0A12D92b8ba7369ecc87BcD04643Fa0CfDB',
    ),
  },
  [CHAIN_IDS.MONAD_MAINNET]: {
    Controller: getAddress('0x19b68a2b909D96c05B623050C276FBD457De8e83'),
    BookManager: getAddress('0x6657d192273731C3cAc646cc82D5F28D0CBE8CCC'),
    BookViewer: getAddress('0xe424c211e2Ed8a5B6d1C57FA493C41715568D238'),
    Rebalancer: getAddress('0xB09684f5486d1af80699BbC27f14dd5A905da873'),
    Strategy: getAddress('0x54cd5332b1689b6506Ce089DA5651B1A814e9E7D'),
    Minter: getAddress('0xb1251BF43Bb7De76DE7e6CE7B64aF843dfc9d242'),
    Operator: getAddress('0xCBd3C0B81A9a36356a3669A7f60A0d2F0846195B'),
    Wrapped6909Factory: getAddress(
      '0x9050b0A12D92b8ba7369ecc87BcD04643Fa0CfDB',
    ),
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
    Wrapped6909Factory: getAddress(
      '0x0000000000000000000000000000000000000000',
    ),
  },
  [CHAIN_IDS.GIWA_SEPOLIA]: {
    Controller: getAddress('0x2EF0F04fbA5bCa42cC9569f4f2E3A4D11f182600'),
    BookManager: getAddress('0x16CF06ECB016e449c57b94B8368f2d45D5cf343D'),
    BookViewer: getAddress('0x7d06c636bA86BD1fc2C38B11F1e5701145CABc30'),
    Rebalancer: getAddress('0xb735FdD82497Dd9AbfEEAdc659b960473BF896E0'),
    Strategy: getAddress('0xAb949978abdDaaEf302C582DFF87B5a3c6B7485d'),
    Minter: getAddress('0xB156b7F0fCC507d51CF2Ad6875e93e49c19c29Fc'),
    Operator: getAddress('0x29BABdBaAdD82739FAF296fBbce9eF1654bE9978'),
    Wrapped6909Factory: getAddress(
      '0x0000000000000000000000000000000000000000',
    ),
  },
}
