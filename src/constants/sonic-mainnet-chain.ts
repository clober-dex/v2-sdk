import { defineChain } from 'viem'

export const sonicMainnet = /*#__PURE__*/ defineChain({
  id: 146,
  name: 'Sonic Mainnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Sonic',
    symbol: 'S',
  },
  rpcUrls: {
    default: { http: ['https://rpc.soniclabs.com'] },
  },
  blockExplorers: {
    default: {
      name: 'Sonic Mainnet',
      url: 'https://sonicscan.org',
    },
  },
  testnet: false,
  contracts: {
    multicall3: {
      address: '0xcA11bde05977b3631167028862bE2a173976CA11',
      blockCreated: 60,
    },
  },
})
