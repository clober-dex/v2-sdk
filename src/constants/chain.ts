import {
  arbitrumSepolia,
  base,
  berachainTestnet,
  type Chain,
} from 'viem/chains'

export enum CHAIN_IDS {
  ARBITRUM_SEPOLIA = arbitrumSepolia.id,
  BASE = base.id,
  BERACHAIN_TESTNET = berachainTestnet.id,
}

export const CHAIN_MAP: {
  [chain in CHAIN_IDS]: Chain
} = {
  [CHAIN_IDS.ARBITRUM_SEPOLIA]: arbitrumSepolia,
  [CHAIN_IDS.BASE]: base,
  [CHAIN_IDS.BERACHAIN_TESTNET]: berachainTestnet,
}
