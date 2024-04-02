import { arbitrumSepolia, type Chain } from 'viem/chains'

export enum CHAIN_IDS {
  ARBITRUM_SEPOLIA = arbitrumSepolia.id,
}

export const CHAIN_MAP: {
  [chain in CHAIN_IDS]: Chain
} = {
  [CHAIN_IDS.ARBITRUM_SEPOLIA]: arbitrumSepolia,
}
