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
        'https://testnet-rpc2.monad.xyz/52227f026fa8fac9e2014c58fbf5643369b3bfc6',
      ],
    },
    public: {
      http: [
        'https://testnet-rpc2.monad.xyz/52227f026fa8fac9e2014c58fbf5643369b3bfc6',
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
