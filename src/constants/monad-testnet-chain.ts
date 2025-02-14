import { defineChain } from 'viem'

export const monadTestnet = /*#__PURE__*/ defineChain({
  id: 10143,
  name: 'Monad Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'MON',
    symbol: 'MON',
  },
  rpcUrls: {
    default: {
      http: ['https://monad-api.blockvision.org/testnet/api'],
    },
  },
  blockExplorers: {
    default: {
      name: 'monadexplorer',
      url: 'https://testnet.monadexplorer.com/',
    },
  },
  testnet: true,
  contracts: {
    multicall3: {
      address: '0xcA11bde05977b3631167028862bE2a173976CA11',
      blockCreated: 251449,
    },
  },
})
