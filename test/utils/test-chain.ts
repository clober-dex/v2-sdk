import { Chain } from 'viem'
import { arbitrumSepolia } from 'viem/chains'

export const cloberTestChain: Chain = {
  id: arbitrumSepolia.id,
  name: 'Clober Test Chain',
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [''],
    },
    public: {
      http: [''],
    },
  },
  contracts: {
    multicall3: {
      address: '0xca11bde05977b3631167028862be2a173976ca11',
      blockCreated: 81930,
    },
  },
}
