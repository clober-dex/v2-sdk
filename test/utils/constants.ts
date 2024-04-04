import * as dotenv from 'dotenv'
dotenv.config()

export const FORK_URL =
  process.env.ARBITRUM_SEPOLIA_RPC_URL ||
  'https://arbitrum-sepolia-archive.allthatnode.com'
export const FORK_BLOCK_NUMBER = 29905059n
export const TEST_MNEMONIC =
  'loop curious foster tank depart vintage regret net frozen version expire vacant there zebra world'
