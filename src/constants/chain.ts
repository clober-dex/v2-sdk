import {
  arbitrumSepolia,
  base,
  berachainTestnet,
  type Chain,
  zkSyncSepoliaTestnet,
} from 'viem/chains'

export enum CHAIN_IDS {
  CLOBER_TESTNET = 7777,
  ARBITRUM_SEPOLIA = arbitrumSepolia.id,
  BASE = base.id,
  BERACHAIN_TESTNET = berachainTestnet.id,
  ZKSYNC_SEPOLIA = zkSyncSepoliaTestnet.id,
}

export const CHAIN_MAP: {
  [chain in CHAIN_IDS]: Chain
} = {
  [CHAIN_IDS.CLOBER_TESTNET]: {
    ...arbitrumSepolia,
    id: CHAIN_IDS.CLOBER_TESTNET,
  },
  [CHAIN_IDS.ARBITRUM_SEPOLIA]: arbitrumSepolia,
  [CHAIN_IDS.BASE]: base,
  [CHAIN_IDS.BERACHAIN_TESTNET]: {
    ...berachainTestnet,
    contracts: {
      multicall3: {
        address: '0xcA11bde05977b3631167028862bE2a173976CA11',
        blockCreated: 866924,
      },
    },
  },
  [CHAIN_IDS.ZKSYNC_SEPOLIA]: zkSyncSepoliaTestnet,
}
