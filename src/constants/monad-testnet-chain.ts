import { defineChain } from 'viem'

export const monadTestnet = /*#__PURE__*/ defineChain({
  id: 10143,
  name: 'Monad Testnet',
  network: 'monad',
  nativeCurrency: {
    decimals: 18,
    name: 'MON',
    symbol: 'MON',
  },
  rpcUrls: {
    default: {
      http: [
        'https://monad-testnet.g.alchemy.com/v2/3Um4IcT1mrq2MEOYurXvsRAzk_v3Q_4X',
      ],
    },
    public: {
      http: [
        'https://monad-testnet.g.alchemy.com/v2/3Um4IcT1mrq2MEOYurXvsRAzk_v3Q_4X',
      ],
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
      address: '0x6cEfcd4DCA776FFaBF6E244616ea573e4d646566',
      blockCreated: 42209,
    },
  },
})
