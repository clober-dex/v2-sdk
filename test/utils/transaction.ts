import type {
  Account,
  PublicClient,
  TransactionReceipt,
  WalletClient,
} from 'viem'
import { Transaction } from '@clober/v2-sdk'

export const waitForTransaction = async ({
  transaction,
  publicClient,
  walletClient,
}: {
  transaction: Transaction
  publicClient: PublicClient
  walletClient: WalletClient
}): Promise<TransactionReceipt> => {
  const hash = await walletClient.sendTransaction({
    chain: publicClient.chain,
    ...transaction!,
    account: walletClient.account as Account,
  })
  const receipt = await publicClient.waitForTransactionReceipt({ hash })
  if (receipt.status !== 'success') {
    throw new Error(`Transaction failed: ${hash}`)
  }
  return receipt
}
