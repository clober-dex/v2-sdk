import { arbitrumSepolia, type Chain } from 'viem/chains'

import { cloberTestChain } from './test-chain'

export enum CHAIN_IDS {
  CLOBER_TESTNET = cloberTestChain.id,
  ARBITRUM_SEPOLIA = arbitrumSepolia.id,
}

export const CHAIN_MAP: {
  [chain in CHAIN_IDS]: Chain
} = {
  [CHAIN_IDS.CLOBER_TESTNET]: cloberTestChain,
  [CHAIN_IDS.ARBITRUM_SEPOLIA]: arbitrumSepolia,
}
