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
        'https://side-cold-water.monad-testnet.quiknode.pro/cdca51dfe940664aca31fad3acaee682eee43c3b/',
      ],
    },
    public: {
      http: [
        'https://side-cold-water.monad-testnet.quiknode.pro/cdca51dfe940664aca31fad3acaee682eee43c3b/',
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
