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
    Controller: getAddress('0x43D614B1bA4bA469fAEAa4557AEAFdec039b8795'),
    BookManager: getAddress('0xBe84BD49aAf710Cc11FA9675c79D107af8552f17'),
    BookViewer: getAddress('0x474fb05A287f4BF3aE6A728FEC5E70967B3A04dC'),
    Rebalancer: getAddress('0x9C6C405cbB2c1DC7aAAa65156744fC00efc7EC82'),
    Strategy: getAddress('0x253F7b745d69eAAAe60b60153850070C572b4daA'),
    Minter: getAddress('0x6563188ADfBa863B42B50d010ed0fCD09fBDcD59'),
    Operator: getAddress('0x5a5E58992AadA8770d3220f0af7c39c8476f7A1d'),
    Wrapped6909Factory: getAddress(
      '0x0000000000000000000000000000000000000000',
    ),
  },
}
