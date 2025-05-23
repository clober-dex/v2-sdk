import * as dotenv from 'dotenv'
import { privateKeyToAccount } from 'viem/accounts'

dotenv.config()

export const FORK_URL =
  process.env.ARBITRUM_SEPOLIA_RPC_URL ||
  'https://arbitrum-sepolia-archive.allthatnode.com'

export const FORK_BLOCK_NUMBER = 32836280n

export const FORK_BLOCK_NUMBER_2 = 155908666n

export const account = privateKeyToAccount(
  process.env.DEV_PRIVATE_KEY as `0x${string}`,
)

export const DEV_MNEMONIC_SEED =
  'loop curious foster tank depart vintage regret net frozen version expire vacant there zebra world'
