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
    VoteLockedCloberToken: `0x${string}`
    ElectionGovernor: `0x${string}`
    KeepersRegistry: `0x${string}`
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
    VoteLockedCloberToken: getAddress(
      '0xA8d4E6BC755b3ed8DCE2FaFE4104Bdad645763A5',
    ),
    ElectionGovernor: getAddress('0xE002A871B314Cc253d4e25E43Afca0557df9577f'),
    KeepersRegistry: getAddress('0x683E045f5b318d343d6f5E9fF83AF4BB0f6fd026'),
  },
  [CHAIN_IDS.CLOBER_TESTNET_2]: {
    Controller: getAddress('0xE64aCE1bF550E57461cd4e24706633d7faC9D7b0'),
    BookManager: getAddress('0xAA9575d63dFC224b9583fC303dB3188C08d5C85A'),
    BookViewer: getAddress('0x3e22d091F90ae759733B7CB06a6f7b440d84a425'),
    Rebalancer: getAddress('0x30b4e9215322B5d0c290249126bCf96C2Ca8e948'),
    Strategy: getAddress('0x540488b54c8DE6e44Db7553c3A2C4ABEb09Fc69C'),
    Minter: getAddress('0x0b8361a2bbF853F5F6Aa0911a9d238d9CFDD9f1a'),
    Operator: getAddress('0xFa47E8dD8F04BF23b238900e754041123a6bc6e2'),
    VoteLockedCloberToken: getAddress(
      '0xA8d4E6BC755b3ed8DCE2FaFE4104Bdad645763A5',
    ),
    ElectionGovernor: getAddress('0xE002A871B314Cc253d4e25E43Afca0557df9577f'),
    KeepersRegistry: getAddress('0x683E045f5b318d343d6f5E9fF83AF4BB0f6fd026'),
  },
  [CHAIN_IDS.ARBITRUM_SEPOLIA]: {
    Controller: getAddress('0xE64aCE1bF550E57461cd4e24706633d7faC9D7b0'),
    BookManager: getAddress('0xAA9575d63dFC224b9583fC303dB3188C08d5C85A'),
    BookViewer: getAddress('0x3e22d091F90ae759733B7CB06a6f7b440d84a425'),
    Rebalancer: getAddress('0x30b4e9215322B5d0c290249126bCf96C2Ca8e948'),
    Strategy: getAddress('0x540488b54c8DE6e44Db7553c3A2C4ABEb09Fc69C'),
    Minter: getAddress('0x0b8361a2bbF853F5F6Aa0911a9d238d9CFDD9f1a'),
    Operator: getAddress('0xFa47E8dD8F04BF23b238900e754041123a6bc6e2'),
    VoteLockedCloberToken: getAddress(
      '0xA8d4E6BC755b3ed8DCE2FaFE4104Bdad645763A5',
    ),
    ElectionGovernor: getAddress('0xE002A871B314Cc253d4e25E43Afca0557df9577f'),
    KeepersRegistry: getAddress('0x683E045f5b318d343d6f5E9fF83AF4BB0f6fd026'),
  },
  [CHAIN_IDS.BASE]: {
    Controller: getAddress('0xe4AB03992e214acfdCD05ccFB5C5C16e3d0Ca371'),
    BookManager: getAddress('0x382CCccbD3b142D7DA063bF68cd0c89634767F76'),
    BookViewer: getAddress('0xbfb608D67340fa54bA31614C293750EeB573c795'),
    Rebalancer: getAddress('0x6A0b87D6b74F7D5C92722F6a11714DBeDa9F3895'),
    Strategy: getAddress('0x9092e5f62b27c3eD78feB24A0F2ad6474D26DdA5'),
    Minter: getAddress('0x732547BB8825eAb932Dcda030Fc446bf4A5552f3'),
    Operator: getAddress('0xBB854e8C0f04d919aD770b27015Ee90a9EF31Bf0'),
    VoteLockedCloberToken: zeroAddress,
    ElectionGovernor: zeroAddress,
    KeepersRegistry: zeroAddress,
  },
  [CHAIN_IDS.BERACHAIN_TESTNET]: {
    Controller: getAddress('0xce3F3C90970C08Fe451998441b30879560AA6757'),
    BookManager: getAddress('0x874b1B795993653fbFC3f1c1fc0469214cC9F4A5'),
    BookViewer: getAddress('0xb735FdD82497Dd9AbfEEAdc659b960473BF896E0'),
    Rebalancer: zeroAddress,
    Strategy: zeroAddress,
    Minter: zeroAddress,
    Operator: zeroAddress,
    VoteLockedCloberToken: zeroAddress,
    ElectionGovernor: zeroAddress,
    KeepersRegistry: zeroAddress,
  },
  [CHAIN_IDS.MITOSIS_TESTNET]: {
    Controller: getAddress('0x6ef1c5D4cB1ebcC24d4BD7eB1b4467F26B6F2C1e'),
    BookManager: getAddress('0x874b1B795993653fbFC3f1c1fc0469214cC9F4A5'),
    BookViewer: getAddress('0x5C91A02B8B5D10597fc6cA23faF56F9718D1feD0'),
    Rebalancer: zeroAddress,
    Strategy: zeroAddress,
    Minter: zeroAddress,
    Operator: zeroAddress,
    VoteLockedCloberToken: zeroAddress,
    ElectionGovernor: zeroAddress,
    KeepersRegistry: zeroAddress,
  },
  [CHAIN_IDS.SONIC_MAINNET]: {
    Controller: getAddress('0xADc0CC0c3Ea12e57b8BcB7d7C8ac03222487E337'),
    BookManager: getAddress('0xD4aD5Ed9E1436904624b6dB8B1BE31f36317C636'),
    BookViewer: getAddress('0xe81e78f946e34d13Dcb6fd46a78713E0FFDA5613'),
    Rebalancer: getAddress('0x46107Ec44112675689053b96aea2127fD952bd47'),
    Strategy: getAddress('0xdd30f831bEB51fBF33E3D579e5529d3B1495554f'),
    Minter: getAddress('0x466795C0EAe3C44A6dcbB6DB0534F7019E0803A7'),
    Operator: getAddress('0xF7E7285eBe537fDf1C1c4432aa1863721EaC9a09'),
    VoteLockedCloberToken: zeroAddress,
    ElectionGovernor: zeroAddress,
    KeepersRegistry: zeroAddress,
  },
  [CHAIN_IDS.ZKSYNC]: {
    Controller: getAddress('0x2Bd904F455928833F8E8C706d1cf01Eb5daaee7C'),
    BookManager: getAddress('0xAc6AdB2727F99C309acd511D942c0b2812e03614'),
    BookViewer: getAddress('0x6e717aA9BB48129aeDC408D435Cc54F79E8A747a'),
    Rebalancer: zeroAddress,
    Strategy: zeroAddress,
    Minter: zeroAddress,
    Operator: zeroAddress,
    VoteLockedCloberToken: zeroAddress,
    ElectionGovernor: zeroAddress,
    KeepersRegistry: zeroAddress,
  },
}
