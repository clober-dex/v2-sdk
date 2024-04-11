import { createWalletClient, HDAccount, http, PrivateKeyAccount } from 'viem'

import { CHAIN_IDS, CHAIN_MAP } from './constants/chain'
import { CONTRACT_ADDRESSES } from './constants/addresses'
import { fetchIsApprovedForAll } from './utils/approval'

const _abi = [
  {
    inputs: [
      {
        internalType: 'address',
        name: 'operator',
        type: 'address',
      },
      {
        internalType: 'bool',
        name: 'approved',
        type: 'bool',
      },
    ],
    name: 'setApprovalForAll',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const

/**
 * Sets approval of all open orders for the specified account on the given chain.
 *
 * @param {CHAIN_IDS} chainId The chain ID.
 * @param {HDAccount | PrivateKeyAccount} account The Ethereum account for which approval is to be set.
 * @param {Object} [options] Optional parameters for setting approval.
 * @param {string} options.rpcUrl The RPC URL to use for executing the transaction.
 * @returns {Promise<`0x${string}` | undefined>} Promise resolving to the transaction hash. If the account is already approved for all, the promise resolves to `undefined`.
 * @example
 * import { setApprovalOfOpenOrdersForAll } from '@clober/v2-sdk'
 * import { privateKeyToAccount } from 'viem/accounts'
 *
 * const hash = await setApprovalOfOpenOrdersForAll(
 *   421614,
 *   privateKeyToAccount('0x...')
 * )
 *
 * @example
 * import { setApprovalOfOpenOrdersForAll } from '@clober/v2-sdk'
 * import { mnemonicToAccount } from 'viem/accounts'
 *
 * const hash = await setApprovalOfOpenOrdersForAll(
 *   421614,
 *   mnemonicToAccount('legal ...')
 * )
 */
export const setApprovalOfOpenOrdersForAll = async (
  chainId: CHAIN_IDS,
  account: HDAccount | PrivateKeyAccount,
  options?: {
    rpcUrl: string
  },
): Promise<`0x${string}` | undefined> => {
  const isApprovedForAll = await fetchIsApprovedForAll(chainId, account.address)
  if (isApprovedForAll) {
    return undefined
  }
  const walletClient = createWalletClient({
    chain: CHAIN_MAP[chainId],
    account,
    transport: options?.rpcUrl ? http(options.rpcUrl) : http(),
  })
  return walletClient.writeContract({
    account,
    chain: CHAIN_MAP[chainId],
    address: CONTRACT_ADDRESSES[chainId]!.BookManager,
    abi: _abi,
    functionName: 'setApprovalForAll',
    args: [CONTRACT_ADDRESSES[chainId]!.Controller, true],
  })
}
