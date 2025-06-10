import { Chain } from 'viem'

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
      http: ['http://127.0.0.1'],
    },
    public: {
      http: ['http://127.0.0.1'],
    },
  },
  contracts: {
    multicall3: {
      address: '0xca11bde05977b3631167028862be2a173976ca11',
      blockCreated: 81930,
    },
  },
}

export const cloberTestChain2: Chain = {
  id: 77773,
  name: 'Clober Test Chain 2',
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['http://127.0.0.1'],
    },
    public: {
      http: ['http://127.0.0.1'],
    },
  },
  contracts: {
    multicall3: {
      address: '0xca11bde05977b3631167028862be2a173976ca11',
      blockCreated: 81930,
    },
  },
}

export const cloberTestChain3: Chain = {
  id: 77773,
  name: 'Clober Test Chain 3',
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['http://127.0.0.1'],
    },
    public: {
      http: ['http://127.0.0.1'],
    },
  },
  contracts: {
    multicall3: {
      address: '0xca11bde05977b3631167028862be2a173976ca11',
      blockCreated: 81930,
    },
  },
}
