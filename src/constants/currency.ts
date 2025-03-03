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

export const MITO: Currency = {
  address: zeroAddress,
  name: 'MITO Token',
  symbol: 'MITO',
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
  [CHAIN_IDS.BERACHAIN_TESTNET]: BERA,
  [CHAIN_IDS.MITOSIS_TESTNET]: MITO,
  [CHAIN_IDS.MONAD_TESTNET]: MON,
  [CHAIN_IDS.SONIC_MAINNET]: S,
  [CHAIN_IDS.ZKSYNC]: ETH,
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
  [CHAIN_IDS.BERACHAIN_TESTNET]: [
    '0x7507c1dc16935B82698e4C63f2746A2fCf994dF8', // WBERA
  ],
  [CHAIN_IDS.MITOSIS_TESTNET]: [
    '0x8B71fD76b23721d0D73CA14Ea6464AAD70149B67', // WMITO
  ],
  [CHAIN_IDS.MONAD_TESTNET]: [
    '0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701', // WMON
  ],
  [CHAIN_IDS.SONIC_MAINNET]: [
    '0x039e2fB66102314Ce7b64Ce5Ce3E5183bc94aD38', // wS
  ],
  [CHAIN_IDS.ZKSYNC]: ['0x5AEa5775959fBC2557Cc8789bC1bf90A239D9a91'],
}

// @dev: https://defillama.com/stablecoin
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
  [CHAIN_IDS.BERACHAIN_TESTNET]: [
    '0x0E4aaF1351de4c0264C5c7056Ef3777b41BD8e03', // HONEY
    '0xd6D83aF58a19Cd14eF3CF6fe848C9A4d21e5727c', // USDC
    '0x05D0dD5135E3eF3aDE32a9eF9Cb06e8D37A6795D', // USDT
  ],
  [CHAIN_IDS.MITOSIS_TESTNET]: [
    '0xCB0CedF61be0Bf4d5F6596b8ab296614b154db91', // USDT
    '0xb8f230Ea91516787F2cbB2c63b147Ec79988E3ED', // USDe
  ],
  [CHAIN_IDS.MONAD_TESTNET]: [
    '0x43D614B1bA4bA469fAEAa4557AEAFdec039b8795', // Clober USDC
    '0xf817257fed379853cDe0fa4F97AB987181B1E5Ea', // USDC
  ],
  [CHAIN_IDS.SONIC_MAINNET]: [
    '0x29219dd400f2Bf60E5a23d13Be72B486D4038894', // USDC
  ],
  [CHAIN_IDS.ZKSYNC]: [
    '0x1d17CBcF0D6D143135aE902365D2E5e2A16538D4', // USDC
  ],
}
