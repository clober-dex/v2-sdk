import * as dotenv from 'dotenv'
import { privateKeyToAccount } from 'viem/accounts'
import { createPublicClient, createWalletClient, http } from 'viem'

import { cloberTestChain } from './test-chain'

dotenv.config()

export const FORK_URL =
  process.env.ARBITRUM_SEPOLIA_RPC_URL ||
  'https://arbitrum-sepolia-archive.allthatnode.com'
export const account = privateKeyToAccount(
  process.env.DEV_PRIVATE_KEY as `0x${string}`,
)

export const publicClient = createPublicClient({
  chain: cloberTestChain,
  transport: http(FORK_URL),
})

export const walletClient = createWalletClient({
  chain: cloberTestChain,
  account,
  transport: http(FORK_URL),
})
