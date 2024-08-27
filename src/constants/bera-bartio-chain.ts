import { defineChain } from 'viem'

export const berachainBartioTestnet = /*#__PURE__*/ defineChain({
  id: 80084,
  name: 'Berachain bArtio',
  nativeCurrency: {
    decimals: 18,
    name: 'Berachain Token',
    symbol: 'BERA',
  },
  rpcUrls: {
    default: { http: ['https://bartio.rpc.berachain.com'] },
  },
  blockExplorers: {
    default: {
      name: 'Berachain',
      url: 'https://bartio.beratrail.io',
    },
  },
  testnet: true,
  contracts: {
    multicall3: {
      address: '0xcA11bde05977b3631167028862bE2a173976CA11',
      blockCreated: 109269,
    },
  },
})
