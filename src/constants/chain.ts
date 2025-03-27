import {
  arbitrumSepolia,
  base,
  type Chain,
  mitosisTestnet,
  monadTestnet,
  sonic,
  zkSync,
  berachain,
} from 'viem/chains'

import { cloberTestChain, cloberTestChain2 } from './test-chain'
import { berachainBartioTestnet } from './bera-bartio-chain'

// follow the https://docs.alchemy.com/reference/supported-subgraph-chains
export enum CHAIN_IDS {
  CLOBER_TESTNET = cloberTestChain.id,
  CLOBER_TESTNET_2 = cloberTestChain2.id,
  ARBITRUM_SEPOLIA = arbitrumSepolia.id,
  BASE = base.id,
  BERACHAIN_MAINNET = berachain.id,
  BERACHAIN_TESTNET = berachainBartioTestnet.id,
  MITOSIS_TESTNET = mitosisTestnet.id,
  MONAD_TESTNET = monadTestnet.id,
  SONIC_MAINNET = sonic.id,
  ZKSYNC_ERA = zkSync.id,
  RISE_TESTNET = 11155931,
}

export const CHAIN_MAP: {
  [chain in CHAIN_IDS]: Chain
} = {
  [CHAIN_IDS.CLOBER_TESTNET]: cloberTestChain,
  [CHAIN_IDS.CLOBER_TESTNET_2]: cloberTestChain2,
  [CHAIN_IDS.ARBITRUM_SEPOLIA]: arbitrumSepolia,
  [CHAIN_IDS.BASE]: base,
  [CHAIN_IDS.BERACHAIN_MAINNET]: berachain,
  [CHAIN_IDS.BERACHAIN_TESTNET]: berachainBartioTestnet,
  [CHAIN_IDS.MITOSIS_TESTNET]: mitosisTestnet,
  [CHAIN_IDS.MONAD_TESTNET]: monadTestnet,
  [CHAIN_IDS.SONIC_MAINNET]: sonic,
  [CHAIN_IDS.ZKSYNC_ERA]: zkSync,
}

export const isTestnetChain = (chainId: CHAIN_IDS): boolean =>
  chainId === CHAIN_IDS.CLOBER_TESTNET ||
  chainId === CHAIN_IDS.CLOBER_TESTNET_2 ||
  chainId === CHAIN_IDS.ARBITRUM_SEPOLIA ||
  chainId === CHAIN_IDS.BERACHAIN_TESTNET ||
  chainId === CHAIN_IDS.MITOSIS_TESTNET ||
  chainId === CHAIN_IDS.MONAD_TESTNET
