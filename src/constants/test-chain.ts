import { Chain } from 'viem'

const http = Array.from(
  { length: 2 },
  (_, i) => `http://localhost:8545/${i + 1}`,
)

export const cloberTestChain: Chain = {
  id: 7777,
  name: 'Clober Test Chain',
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http,
    },
    public: {
      http,
    },
  },
  contracts: {
    multicall3: {
      address: '0xca11bde05977b3631167028862be2a173976ca11',
      blockCreated: 81930,
    },
  },
}
