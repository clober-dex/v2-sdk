import {
  arbitrumSepolia,
  base,
  type Chain,
  mitosisTestnet,
  monadTestnet,
  sonic,
  zkSync,
} from 'viem/chains'

import { cloberTestChain, cloberTestChain2 } from './test-chain'
import { berachainBartioTestnet } from './bera-bartio-chain'

export enum CHAIN_IDS {
  CLOBER_TESTNET = cloberTestChain.id,
  CLOBER_TESTNET_2 = cloberTestChain2.id,
  ARBITRUM_SEPOLIA = arbitrumSepolia.id,
  BASE = base.id,
  BERACHAIN_TESTNET = berachainBartioTestnet.id,
  MITOSIS_TESTNET = mitosisTestnet.id,
  MONAD_TESTNET = monadTestnet.id,
  SONIC_MAINNET = sonic.id,
  ZKSYNC = zkSync.id,
}

export const CHAIN_MAP: {
  [chain in CHAIN_IDS]: Chain
} = {
  [CHAIN_IDS.CLOBER_TESTNET]: cloberTestChain,
  [CHAIN_IDS.CLOBER_TESTNET_2]: cloberTestChain2,
  [CHAIN_IDS.ARBITRUM_SEPOLIA]: arbitrumSepolia,
  [CHAIN_IDS.BASE]: base,
  [CHAIN_IDS.BERACHAIN_TESTNET]: berachainBartioTestnet,
  [CHAIN_IDS.MITOSIS_TESTNET]: mitosisTestnet,
  [CHAIN_IDS.MONAD_TESTNET]: monadTestnet,
  [CHAIN_IDS.SONIC_MAINNET]: sonic,
  [CHAIN_IDS.ZKSYNC]: zkSync,
}

export const isTestnetChain = (chainId: CHAIN_IDS): boolean =>
  chainId === CHAIN_IDS.CLOBER_TESTNET ||
  chainId === CHAIN_IDS.CLOBER_TESTNET_2 ||
  chainId === CHAIN_IDS.ARBITRUM_SEPOLIA ||
  chainId === CHAIN_IDS.BERACHAIN_TESTNET ||
  chainId === CHAIN_IDS.MITOSIS_TESTNET ||
  chainId === CHAIN_IDS.MONAD_TESTNET
