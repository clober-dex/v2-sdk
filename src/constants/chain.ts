import { arbitrumSepolia, type Chain, mainnet } from 'viem/chains'

import { cloberTestChain } from './test-chain'

export enum CHAIN_IDS {
  CLOBER_TEST_CHAIN = cloberTestChain.id,
  MAINNET = mainnet.id,
  ARBITRUM_SEPOLIA = arbitrumSepolia.id,
}

export const CHAIN_MAP: {
  [chain in CHAIN_IDS]: Chain
} = {
  [CHAIN_IDS.CLOBER_TEST_CHAIN]: cloberTestChain,
  [CHAIN_IDS.ARBITRUM_SEPOLIA]: arbitrumSepolia,
}
