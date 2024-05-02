import * as dotenv from 'dotenv'
import { privateKeyToAccount } from 'viem/accounts'
import { createPublicClient, createWalletClient, http } from 'viem'

import { cloberTestChain } from '../../src/constants/test-chain'

dotenv.config()

export const FORK_URL =
  process.env.ARBITRUM_SEPOLIA_RPC_URL ||
  'https://arbitrum-sepolia-archive.allthatnode.com'

export const FORK_BLOCK_NUMBER = 32836280n

export const account = privateKeyToAccount(
  process.env.DEV_PRIVATE_KEY as `0x${string}`,
)

export const publicClient = createPublicClient({
  chain: cloberTestChain,
  transport: http('http://localhost:8545'),
})

export const walletClient = createWalletClient({
  chain: cloberTestChain,
  account,
  transport: http('http://localhost:8545'),
})

export const DEV_MNEMONIC_SEED =
  'loop curious foster tank depart vintage regret net frozen version expire vacant there zebra world'
