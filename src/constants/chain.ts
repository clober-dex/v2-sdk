import { arbitrumSepolia, base, type Chain, zkSync } from 'viem/chains'

import { cloberTestChain } from './test-chain'
import { berachainBartioTestnet } from './bera-bartio-chain'

export enum CHAIN_IDS {
  CLOBER_TESTNET = cloberTestChain.id,
  ARBITRUM_SEPOLIA = arbitrumSepolia.id,
  BASE = base.id,
  BERACHAIN_TESTNET = berachainBartioTestnet.id,
  ZKSYNC = zkSync.id,
}

export const CHAIN_MAP: {
  [chain in CHAIN_IDS]: Chain
} = {
  [CHAIN_IDS.CLOBER_TESTNET]: cloberTestChain,
  [CHAIN_IDS.ARBITRUM_SEPOLIA]: arbitrumSepolia,
  [CHAIN_IDS.BASE]: base,
  [CHAIN_IDS.BERACHAIN_TESTNET]: berachainBartioTestnet,
  [CHAIN_IDS.ZKSYNC]: zkSync,
}

export const isTestnetChain = (chainId: CHAIN_IDS): boolean =>
  chainId === CHAIN_IDS.CLOBER_TESTNET ||
  chainId === CHAIN_IDS.ARBITRUM_SEPOLIA ||
  chainId === CHAIN_IDS.BERACHAIN_TESTNET
