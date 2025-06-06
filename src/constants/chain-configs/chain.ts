import {
  arbitrumSepolia,
  berachain,
  type Chain,
  monadTestnet,
} from 'viem/chains'

import {
  cloberTestChain,
  cloberTestChain2,
  cloberTestChain3,
} from '../networks/test-chain'
import { riseSepolia } from '../networks/rise-sepolia'

// follow the https://docs.alchemy.com/reference/supported-subgraph-chains
export enum CHAIN_IDS {
  CLOBER_TESTNET = cloberTestChain.id,
  CLOBER_TESTNET_2 = cloberTestChain2.id,
  CLOBER_TESTNET_3 = cloberTestChain3.id,
  ARBITRUM_SEPOLIA = arbitrumSepolia.id,
  // BASE = base.id,
  BERACHAIN_MAINNET = berachain.id,
  MONAD_TESTNET = monadTestnet.id,
  // SONIC_MAINNET = sonic.id,
  RISE_SEPOLIA = riseSepolia.id,
}

export const CHAIN_MAP: {
  [chain in CHAIN_IDS]: Chain
} = {
  [CHAIN_IDS.CLOBER_TESTNET]: cloberTestChain,
  [CHAIN_IDS.CLOBER_TESTNET_2]: cloberTestChain2,
  [CHAIN_IDS.CLOBER_TESTNET_3]: cloberTestChain3,
  [CHAIN_IDS.ARBITRUM_SEPOLIA]: arbitrumSepolia,
  // [CHAIN_IDS.BASE]: base,
  [CHAIN_IDS.BERACHAIN_MAINNET]: berachain,
  [CHAIN_IDS.MONAD_TESTNET]: monadTestnet,
  // [CHAIN_IDS.SONIC_MAINNET]: sonic,
  [CHAIN_IDS.RISE_SEPOLIA]: riseSepolia,
}
