import { WalletClient } from 'viem'

import { account } from '../test/utils/constants'

import { CHAIN_IDS, CHAIN_MAP } from './constants/chain'
import { CONTRACT_ADDRESSES } from './constants/addresses'
import { fetchIsApprovedForAll } from './utils/approval'
import { decorator } from './utils/decorator'
import type { DefaultOptions } from './type'

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
 * import { privateKeyToAccount } from 'viem/accounts'
 *
 * const hash = await setApprovalOfOpenOrdersForAll({
 *   chainId: 421614,
 *   account: privateKeyToAccount('0x...')
 * })
 *
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
 * const hash = await setApprovalOfOpenOrdersForAll(
 *   421614,
 *   walletClient
 * )
 */
export const setApprovalOfOpenOrdersForAll = decorator(
  async ({
    chainId,
    walletClient,
  }: {
    chainId: CHAIN_IDS
    walletClient: WalletClient
    options?: DefaultOptions
  }): Promise<`0x${string}` | undefined> => {
    const isApprovedForAll = await fetchIsApprovedForAll(
      chainId,
      account.address,
    )
    if (isApprovedForAll) {
      return undefined
    }
    return walletClient.writeContract({
      account,
      chain: CHAIN_MAP[chainId],
      address: CONTRACT_ADDRESSES[chainId]!.BookManager,
      abi: _abi,
      functionName: 'setApprovalForAll',
      args: [CONTRACT_ADDRESSES[chainId]!.Controller, true],
    })
  },
)
