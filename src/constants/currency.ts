import { zeroAddress } from 'viem'

import { Currency } from '../model/currency'

import { CHAIN_IDS } from './chain'

export const ETH: Currency = {
  address: zeroAddress,
  name: 'Ethereum',
  symbol: 'ETH',
  decimals: 18,
}

export const BERA: Currency = {
  address: zeroAddress,
  name: 'BERA Token',
  symbol: 'BERA',
  decimals: 18,
}

export const MON: Currency = {
  address: zeroAddress,
  name: 'Monad Token',
  symbol: 'MON',
  decimals: 18,
}

export const S: Currency = {
  address: zeroAddress,
  name: 'Sonic',
  symbol: 'S',
  decimals: 18,
}

export const NATIVE_CURRENCY: {
  [chain in CHAIN_IDS]: Currency
} = {
  [CHAIN_IDS.CLOBER_TESTNET]: ETH,
  [CHAIN_IDS.CLOBER_TESTNET_2]: ETH,
  [CHAIN_IDS.ARBITRUM_SEPOLIA]: ETH,
  [CHAIN_IDS.BASE]: ETH,
  [CHAIN_IDS.BERACHAIN_MAINNET]: BERA,
  [CHAIN_IDS.RISE_SEPOLIA]: ETH,
  [CHAIN_IDS.MONAD_TESTNET]: MON,
  [CHAIN_IDS.SONIC_MAINNET]: S,
}

export const WETH_ADDRESSES: {
  [chain in CHAIN_IDS]: `0x${string}`[]
} = {
  [CHAIN_IDS.CLOBER_TESTNET]: [zeroAddress],
  [CHAIN_IDS.CLOBER_TESTNET_2]: [
    '0xF2e615A933825De4B39b497f6e6991418Fb31b78', // Mock WETH
  ],
  [CHAIN_IDS.ARBITRUM_SEPOLIA]: [
    '0xF2e615A933825De4B39b497f6e6991418Fb31b78', // Mock WETH
  ],
  [CHAIN_IDS.BASE]: ['0x4200000000000000000000000000000000000006'],
  [CHAIN_IDS.BERACHAIN_MAINNET]: [
    '0x6969696969696969696969696969696969696969', // WBERA
  ],
  [CHAIN_IDS.RISE_SEPOLIA]: ['0x4200000000000000000000000000000000000006'], // WETH
  [CHAIN_IDS.MONAD_TESTNET]: [
    '0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701', // WMON
  ],
  [CHAIN_IDS.SONIC_MAINNET]: [
    '0x039e2fB66102314Ce7b64Ce5Ce3E5183bc94aD38', // wS
  ],
}

// @dev: https://defillama.com/stablecoins
// order by total circulating supply (over $40M)
export const STABLE_COIN_ADDRESSES: {
  [chain in CHAIN_IDS]: `0x${string}`[]
} = {
  [CHAIN_IDS.CLOBER_TESTNET]: [
    '0x00BFD44e79FB7f6dd5887A9426c8EF85A0CD23e0', // Mock USDT
  ],
  [CHAIN_IDS.CLOBER_TESTNET_2]: [
    '0x00BFD44e79FB7f6dd5887A9426c8EF85A0CD23e0', // Mock USDT
  ],
  [CHAIN_IDS.ARBITRUM_SEPOLIA]: [
    '0x00BFD44e79FB7f6dd5887A9426c8EF85A0CD23e0', // Mock USDT
  ],
  [CHAIN_IDS.BASE]: [
    '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC
    '0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA', // USDbC
    '0x4621b7A9c75199271F773Ebd9A499dbd165c3191', // DOLA
    '0xB79DD08EA68A908A97220C76d19A6aA9cBDE4376', // USD+
    '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb', // DAI
  ],
  [CHAIN_IDS.BERACHAIN_MAINNET]: [
    '0xFCBD14DC51f0A4d49d5E53C2E0950e0bC26d0Dce', // HONEY
    '0x5d3a1Ff2b6BAb83b63cd9AD0787074081a52ef34', // USDe
    '0x549943e04f40284185054145c6E4e9568C1D3241', // USDC.e
    '0x779Ded0c9e1022225f8E0630b35a9b54bE713736', // USDT0
  ],
  [CHAIN_IDS.RISE_SEPOLIA]: [
    '0xA985e387dDF21b87c1Fe8A0025D827674040221E', // cUSDC
  ],
  [CHAIN_IDS.MONAD_TESTNET]: [
    '0x43D614B1bA4bA469fAEAa4557AEAFdec039b8795', // Clober USDC
    '0xf817257fed379853cDe0fa4F97AB987181B1E5Ea', // USDC
    '0x88b8E2161DEDC77EF4ab7585569D2415a1C1055D', // USDT
  ],
  [CHAIN_IDS.SONIC_MAINNET]: [
    '0x29219dd400f2Bf60E5a23d13Be72B486D4038894', // USDC
  ],
}
