import { startProxy } from '@viem/anvil'
import * as dotenv from 'dotenv'

import { cloberTestChain } from '../utils/test-chain'
import { DEV_MNEMONIC_SEED, FORK_BLOCK_NUMBER } from '../utils/constants'

dotenv.config()

export default async function () {
  startProxy({
    options: {
      chainId: cloberTestChain.id,
      forkUrl:
        process.env.ARBITRUM_SEPOLIA_RPC_URL ||
        'https://arbitrum-sepolia-archive.allthatnode.com',
      forkBlockNumber: FORK_BLOCK_NUMBER,
      mnemonic: DEV_MNEMONIC_SEED,
      accounts: 10,
      balance: 1000, // 1000 ETH
      autoImpersonate: true,
    },
  })
}
