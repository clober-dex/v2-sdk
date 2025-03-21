import { FeePolicy } from '../model/fee-policy'

import { CHAIN_IDS } from './chain'

export const MAKER_DEFAULT_POLICY: {
  [chain in CHAIN_IDS]: FeePolicy
} = {
  [CHAIN_IDS.CLOBER_TESTNET]: new FeePolicy(true, -300n), // -0.03%,
  [CHAIN_IDS.CLOBER_TESTNET_2]: new FeePolicy(true, -300n), // -0.03%,
  [CHAIN_IDS.ARBITRUM_SEPOLIA]: new FeePolicy(true, 0n), // 0%,
  [CHAIN_IDS.BASE]: new FeePolicy(true, 0n), // 0%,
  [CHAIN_IDS.BERACHAIN_MAINNET]: new FeePolicy(true, 0n), // 0%,
  [CHAIN_IDS.BERACHAIN_TESTNET]: new FeePolicy(true, 0n), // 0%,
  [CHAIN_IDS.MITOSIS_TESTNET]: new FeePolicy(true, 0n), // 0%,
  [CHAIN_IDS.MONAD_TESTNET]: new FeePolicy(true, 0n), // 0%,
  [CHAIN_IDS.SONIC_MAINNET]: new FeePolicy(true, 0n), // 0%,
  [CHAIN_IDS.ZKSYNC_ERA]: new FeePolicy(true, 0n), // 0%,
}

export const TAKER_DEFAULT_POLICY: {
  [chain in CHAIN_IDS]: FeePolicy
} = {
  [CHAIN_IDS.CLOBER_TESTNET]: new FeePolicy(true, 1000n), // 0.1%
  [CHAIN_IDS.CLOBER_TESTNET_2]: new FeePolicy(true, 1000n), // 0.1%
  [CHAIN_IDS.ARBITRUM_SEPOLIA]: new FeePolicy(true, 100n), // 0.01%
  [CHAIN_IDS.BASE]: new FeePolicy(true, 100n), // 0.01%
  [CHAIN_IDS.BERACHAIN_MAINNET]: new FeePolicy(true, 100n), // 0.01%
  [CHAIN_IDS.BERACHAIN_TESTNET]: new FeePolicy(true, 100n), // 0.01%
  [CHAIN_IDS.MITOSIS_TESTNET]: new FeePolicy(true, 100n), // 0.01%
  [CHAIN_IDS.MONAD_TESTNET]: new FeePolicy(true, 100n), // 0.01%
  [CHAIN_IDS.SONIC_MAINNET]: new FeePolicy(true, 100n), // 0.01%
  [CHAIN_IDS.ZKSYNC_ERA]: new FeePolicy(true, 100n), // 0.01%
}
