import { defineChain } from 'viem'

export const riseSepolia = /*#__PURE__*/ defineChain({
  id: 11155931,
  name: 'Rise Sepolia',
  nativeCurrency: {
    decimals: 18,
    name: 'Rise Sepolia Ethereum',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: { http: ['https://testnet.riselabs.xyz'] },
  },
  blockExplorers: {
    default: {
      name: 'Rise Sepolia',
      url: 'https://testnet-explorer.riselabs.xyz',
    },
  },
  testnet: true,
  contracts: {
    multicall3: {
      address: '0xcA11bde05977b3631167028862bE2a173976CA11',
    },
  },
})
