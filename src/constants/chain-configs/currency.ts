import { getAddress, zeroAddress } from 'viem'

import { Currency } from '../../entities/currency/types'

import { CHAIN_IDS } from './chain'

export const ETH: Currency = {
  address: zeroAddress,
  name: 'Ethereum',
  symbol: 'ETH',
  decimals: 18,
}

export const NATIVE_CURRENCY: {
  [chain in CHAIN_IDS]: Currency
} = {
  [CHAIN_IDS.CLOBER_TESTNET]: ETH,
  [CHAIN_IDS.ARBITRUM_SEPOLIA]: ETH,
  // [CHAIN_IDS.BASE]: ETH,
  [CHAIN_IDS.BERACHAIN_MAINNET]: {
    address: zeroAddress,
    name: 'Berachain',
    symbol: 'BERA',
    decimals: 18,
  },
  [CHAIN_IDS.RISE_SEPOLIA]: ETH,
  [CHAIN_IDS.GIWA_SEPOLIA]: ETH,
  [CHAIN_IDS.MONAD_TESTNET]: {
    address: zeroAddress,
    name: 'Monad Token',
    symbol: 'MON',
    decimals: 18,
  },
  [CHAIN_IDS.MONAD_MAINNET]: {
    address: zeroAddress,
    name: 'Monad Token',
    symbol: 'MON',
    decimals: 18,
  },
  // [CHAIN_IDS.SONIC_MAINNET]: S,
}

export const REFERENCE_CURRENCY: {
  [chain in CHAIN_IDS]: Currency
} = {
  [CHAIN_IDS.CLOBER_TESTNET]: {
    address: getAddress('0xF2e615A933825De4B39b497f6e6991418Fb31b78'), // Mock WETH
    symbol: 'WETH',
    name: 'Wrapped Ether',
    decimals: 18,
  },
  [CHAIN_IDS.ARBITRUM_SEPOLIA]: {
    address: getAddress('0xF2e615A933825De4B39b497f6e6991418Fb31b78'), // Mock WETH
    symbol: 'WETH',
    name: 'Wrapped Ether',
    decimals: 18,
  },
  // [CHAIN_IDS.BASE]: '0x4200000000000000000000000000000000000006',
  [CHAIN_IDS.BERACHAIN_MAINNET]: {
    address: getAddress('0x6969696969696969696969696969696969696969'), // WBERA
    symbol: 'WBERA',
    name: 'Wrapped Bera',
    decimals: 18,
  },
  [CHAIN_IDS.RISE_SEPOLIA]: {
    address: getAddress('0x4200000000000000000000000000000000000006'), // Mock WETH
    symbol: 'WETH',
    name: 'Wrapped Ether',
    decimals: 18,
  },
  [CHAIN_IDS.GIWA_SEPOLIA]: {
    address: getAddress('0x4200000000000000000000000000000000000006'), // Mock WETH
    symbol: 'WETH',
    name: 'Wrapped Ether',
    decimals: 18,
  },
  [CHAIN_IDS.MONAD_TESTNET]: {
    address: getAddress('0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701'), // WMON
    symbol: 'WMON',
    name: 'Wrapped Monad',
    decimals: 18,
  },
  [CHAIN_IDS.MONAD_MAINNET]: {
    address: getAddress('0x3bd359C1119dA7Da1D913D1C4D2B7c461115433A'), // WMON
    symbol: 'WMON',
    name: 'Wrapped Monad',
    decimals: 18,
  },
  // [CHAIN_IDS.SONIC_MAINNET]: '0x039e2fB66102314Ce7b64Ce5Ce3E5183bc94aD38', // wS
}

export const NATIVE_CURRENCY_TOTAL_SUPPLY: {
  [chain in CHAIN_IDS]: bigint
} = {
  [CHAIN_IDS.CLOBER_TESTNET]: 120000000000000000000000000n,
  [CHAIN_IDS.ARBITRUM_SEPOLIA]: 120000000000000000000000000n,
  // [CHAIN_IDS.BASE]: ETH,
  [CHAIN_IDS.BERACHAIN_MAINNET]: 502000000000000000000000000n,
  [CHAIN_IDS.RISE_SEPOLIA]: 120000000000000000000000000n,
  [CHAIN_IDS.GIWA_SEPOLIA]: 120000000000000000000000000n,
  [CHAIN_IDS.MONAD_TESTNET]: 10000000000000000000000000000n,
  [CHAIN_IDS.MONAD_MAINNET]: 10000000000000000000000000000n,
  // [CHAIN_IDS.SONIC_MAINNET]: S,
}

// @dev: https://defillama.com/stablecoins
// order by total circulating supply (over $40M)
export const STABLE_COINS: {
  [chain in CHAIN_IDS]: (Currency & { priority?: number })[]
} = {
  [CHAIN_IDS.CLOBER_TESTNET]: [
    {
      address: getAddress('0x00BFD44e79FB7f6dd5887A9426c8EF85A0CD23e0'),
      name: 'Mock USDT',
      symbol: 'MT',
      decimals: 6,
    },
  ],
  [CHAIN_IDS.ARBITRUM_SEPOLIA]: [
    {
      address: getAddress('0x00BFD44e79FB7f6dd5887A9426c8EF85A0CD23e0'),
      name: 'Mock USDT',
      symbol: 'MT',
      decimals: 6,
    },
  ],
  // [CHAIN_IDS.BASE]: [
  //   '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC
  //   '0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA', // USDbC
  //   '0x4621b7A9c75199271F773Ebd9A499dbd165c3191', // DOLA
  //   '0xB79DD08EA68A908A97220C76d19A6aA9cBDE4376', // USD+
  //   '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb', // DAI
  // ],
  [CHAIN_IDS.BERACHAIN_MAINNET]: [
    {
      address: getAddress('0xFCBD14DC51f0A4d49d5E53C2E0950e0bC26d0Dce'),
      name: 'Honey',
      symbol: 'HONEY',
      decimals: 18,
    },
    {
      address: getAddress('0x5d3a1Ff2b6BAb83b63cd9AD0787074081a52ef34'),
      name: 'USDe',
      symbol: 'USDe',
      decimals: 18,
    },
    {
      address: getAddress('0x549943e04f40284185054145c6E4e9568C1D3241'),
      name: 'Bridged USDC (Stargate)',
      symbol: 'USDC.e',
      decimals: 6,
    },
    {
      address: getAddress('0x779Ded0c9e1022225f8E0630b35a9b54bE713736'),
      name: 'USD₮0',
      symbol: 'USD₮0',
      decimals: 6,
    },
  ],
  [CHAIN_IDS.RISE_SEPOLIA]: [
    {
      address: getAddress('0xA985e387dDF21b87c1Fe8A0025D827674040221E'),
      name: 'Clober USD',
      symbol: 'cUSD',
      decimals: 6,
    },
    {
      address: getAddress('0x40918Ba7f132E0aCba2CE4de4c4baF9BD2D7D849'),
      name: 'Tether USD',
      symbol: 'USDT',
      decimals: 8,
    },
    {
      address: getAddress('0x8A93d247134d91e0de6f96547cB0204e5BE8e5D8'),
      name: 'USD Coin',
      symbol: 'USDC',
      decimals: 6,
    },
  ],
  [CHAIN_IDS.GIWA_SEPOLIA]: [
    {
      address: getAddress('0xD031A3C56eD35EFE5F7e5269B088F8C3a2c9d463'),
      name: 'GiwaDex KRW',
      symbol: 'KRWG',
      decimals: 6,
      priority: 1,
    },
    {
      address: getAddress('0x0Cd2C356be90864F4a5e0551E79dd039b246FaCA'),
      name: 'GiwaDex USD',
      symbol: 'USDG',
      decimals: 6,
      priority: 2,
    },
  ],
  [CHAIN_IDS.MONAD_TESTNET]: [
    {
      address: getAddress('0x43D614B1bA4bA469fAEAa4557AEAFdec039b8795'),
      name: 'MockB',
      symbol: 'MOCKB',
      decimals: 6,
    },
    {
      address: getAddress('0xf817257fed379853cDe0fa4F97AB987181B1E5Ea'),
      name: 'USD Coin',
      symbol: 'USDC',
      decimals: 6,
    },
    {
      address: getAddress('0x88b8E2161DEDC77EF4ab7585569D2415a1C1055D'),
      name: 'Tether USD',
      symbol: 'USDT',
      decimals: 6,
    },
  ],
  [CHAIN_IDS.MONAD_MAINNET]: [
    {
      address: getAddress('0x754704Bc059F8C67012fEd69BC8A327a5aafb603'),
      name: 'USD Coin',
      symbol: 'USDC',
      decimals: 6,
    },
    {
      address: getAddress('0x00000000eFE302BEAA2b3e6e1b18d08D69a9012a'),
      name: 'AUSD',
      symbol: 'AUSD',
      decimals: 6,
    },
    {
      address: getAddress('0xe7cd86e13AC4309349F30B3435a9d337750fC82D'),
      name: 'USDT0',
      symbol: 'USDT0',
      decimals: 6,
    },
    {
      address: getAddress('0x103222f020e98Bba0AD9809A011FDF8e6F067496'),
      name: 'earnAUSD',
      symbol: 'earnAUSD',
      decimals: 6,
    },
    {
      address: getAddress('0x111111d2bf19e43C34263401e0CAd979eD1cdb61'),
      name: 'World Liberty Financial USD',
      symbol: 'USD1',
      decimals: 6,
    },
  ],
  // [CHAIN_IDS.SONIC_MAINNET]: [
  //   '0x29219dd400f2Bf60E5a23d13Be72B486D4038894', // USDC
  // ],
}
