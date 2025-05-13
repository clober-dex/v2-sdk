import { createPublicClient, http, WalletClient } from 'viem'

import { CHAIN_IDS, CHAIN_MAP } from '../../constants/chain'
import { DefaultWriteContractOptions } from '../../types'
import { fetchIsApprovedForAll } from '../../entities/currency/apis/approval'
import { CONTRACT_ADDRESSES } from '../../constants/addresses'

/**
 * @dev This function relates with `viem` dependency
 * Sets approval of all open orders for the specified account on the given chain.
 *
 * @param {CHAIN_IDS} chainId The chain ID.
 * @param {WalletClient} walletClient The wallet client.
 * @param {Object} [options] Optional parameters for setting approval.
 * @param {string} options.rpcUrl The RPC URL to use for executing the transaction.
 * @returns {Promise<`0x${string}` | undefined>} Promise resolving to the transaction hash. If the account is already approved for all, the promise resolves to `undefined`.
 * @example
 * import { setApprovalOfOpenOrdersForAll } from '@clober/v2-sdk'
 * import { mnemonicToAccount } from 'viem/accounts'
 *
 * const walletClient = createWalletClient({
 *   chain: arbitrumSepolia,
 *   account: mnemonicToAccount('legal ...'),
 *   transport: http(),
 * })
 *
 * const hash = await setApprovalOfOpenOrdersForAll({
 *   chainId: 421614,
 *   walletClient
 * })
 */
export const setApprovalOfOpenOrdersForAll = async ({
  chainId,
  walletClient,
  options,
}: {
  chainId: CHAIN_IDS
  walletClient: WalletClient
  options?: DefaultWriteContractOptions
}): Promise<`0x${string}` | undefined> => {
  if (!walletClient.account) {
    throw new Error('Account is not found')
  }
  const publicClient = createPublicClient({
    chain: CHAIN_MAP[chainId],
    transport: options?.rpcUrl ? http(options.rpcUrl) : http(),
  })
  const isApprovedForAll = await fetchIsApprovedForAll(
    publicClient,
    chainId,
    walletClient.account.address,
  )
  if (isApprovedForAll) {
    return undefined
  }
  return walletClient.writeContract({
    account: walletClient.account,
    chain: CHAIN_MAP[chainId],
    address: CONTRACT_ADDRESSES[chainId]!.BookManager,
    abi: [
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
    ] as const,
    functionName: 'setApprovalForAll',
    args: [CONTRACT_ADDRESSES[chainId]!.Controller, true],
  })
}
