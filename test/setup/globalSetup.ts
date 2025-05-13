import { startProxy } from '@viem/anvil'
import * as dotenv from 'dotenv'

import {
  cloberTestChain,
  cloberTestChain2,
} from '../../src/constants/networks/test-chain.ts'
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
      gasPrice: 0,
    },
    port: 8545,
  })
  startProxy({
    options: {
      chainId: cloberTestChain2.id,
      forkUrl:
        process.env.ARBITRUM_SEPOLIA_RPC_URL ||
        'https://arbitrum-sepolia-archive.allthatnode.com',
      forkBlockNumber: FORK_BLOCK_NUMBER,
      mnemonic: DEV_MNEMONIC_SEED,
      accounts: 10,
      balance: 1000, // 1000 ETH
      autoImpersonate: true,
      gasPrice: 0,
    },
    port: 8546,
  })
}
