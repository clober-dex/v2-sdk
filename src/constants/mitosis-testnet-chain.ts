import { defineChain } from 'viem'

export const mitosisTestnet = /*#__PURE__*/ defineChain({
  id: 124832,
  name: 'Mitosis Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'MITO Token',
    symbol: 'MITO',
  },
  rpcUrls: {
    default: { http: ['https://rpc.testnet.mitosis.org'] },
  },
  blockExplorers: {
    default: {
      name: 'Mitosis Testnet',
      url: 'https://blockscout-internal.testnet.mitosis.org',
    },
  },
  testnet: true,
  contracts: {
    multicall3: {
      address: '0xcA11bde05977b3631167028862bE2a173976CA11',
      blockCreated: 84239,
    },
  },
})
