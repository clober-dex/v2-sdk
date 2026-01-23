import {
  arbitrumSepolia,
  berachain,
  type Chain,
  monadTestnet,
  monad,
  base,
} from 'viem/chains'

import { cloberTestChain } from '../networks/test-chain'
import { riseSepolia } from '../networks/rise-sepolia'
import { giwaSepolia } from '../networks/giwa-sepolia'

// follow the https://docs.alchemy.com/reference/supported-subgraph-chains
export enum CHAIN_IDS {
  CLOBER_TESTNET = cloberTestChain.id,
  ARBITRUM_SEPOLIA = arbitrumSepolia.id,
  BASE = base.id,
  BERACHAIN_MAINNET = berachain.id,
  MONAD_TESTNET = monadTestnet.id,
  MONAD_MAINNET = monad.id,
  // SONIC_MAINNET = sonic.id,
  RISE_SEPOLIA = riseSepolia.id,
  GIWA_SEPOLIA = giwaSepolia.id,
}

export const CHAIN_MAP: {
  [chain in CHAIN_IDS]: Chain
} = {
  [CHAIN_IDS.CLOBER_TESTNET]: cloberTestChain,
  [CHAIN_IDS.ARBITRUM_SEPOLIA]: arbitrumSepolia,
  [CHAIN_IDS.BASE]: base,
  [CHAIN_IDS.BERACHAIN_MAINNET]: berachain,
  [CHAIN_IDS.MONAD_TESTNET]: monadTestnet,
  [CHAIN_IDS.MONAD_MAINNET]: monad,
  // [CHAIN_IDS.SONIC_MAINNET]: sonic,
  [CHAIN_IDS.RISE_SEPOLIA]: riseSepolia,
  [CHAIN_IDS.GIWA_SEPOLIA]: giwaSepolia,
}
