import { createPublicClient, http, parseUnits, WalletClient } from 'viem'

import { CHAIN_IDS, CHAIN_MAP } from './constants/chain'
import { CONTRACT_ADDRESSES } from './constants/addresses'
import { fetchIsApprovedForAll } from './utils/approval'
import type { DefaultOptions } from './type'
import { fetchAllowance } from './utils/allowance'
import { fetchCurrency } from './utils/currency'

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
  options?: DefaultOptions
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

/**
 * @dev This function relates with `viem` dependency
 * Approves the specified amount of tokens for the given account on the specified chain.
 *
 * @param {CHAIN_IDS} chainId The chain ID.
 * @param {WalletClient} walletClient The wallet client.
 * @param {`0x${string}`} token The ERC20 token address.
 * @param {string | undefined} amount The amount to approve. If not provided, the maximum amount is approved.
 * @param options
 * @param options.rpcUrl The RPC URL of the blockchain.
 * @returns {Promise<`0x${string}` | undefined>} Promise resolving to the transaction hash. If the account is already approved, the promise resolves to `undefined`.
 * @example
 * import { approveERC20 } from '@clober/v2-sdk'
 *
 * const walletClient = createWalletClient({
 *   chain: arbitrumSepolia,
 *   account: mnemonicToAccount('legal ...'),
 *   transport: http(),
 * })
 *
 * const hash = await approveERC20({
 *   chainId: 421614,
 *   walletClient
 *   token: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
 *   amount: '1000.123', // approve 1000.123 USDC
 * })
 */
export const approveERC20 = async ({
  chainId,
  walletClient,
  token,
  amount,
  options,
}: {
  chainId: CHAIN_IDS
  walletClient: WalletClient
  token: `0x${string}`
  amount?: string
  options?: DefaultOptions
}): Promise<`0x${string}` | undefined> => {
  if (!walletClient.account) {
    throw new Error('Account is not found')
  }
  const publicClient = createPublicClient({
    chain: CHAIN_MAP[chainId],
    transport: options?.rpcUrl ? http(options.rpcUrl) : http(),
  })
  const [currency, allowance] = await Promise.all([
    fetchCurrency(publicClient, chainId, token),
    fetchAllowance(
      publicClient,
      token,
      walletClient.account.address,
      CONTRACT_ADDRESSES[chainId]!.Controller,
    ),
  ])
  const value = amount ? parseUnits(amount, currency.decimals) : 2n ** 256n - 1n
  if (allowance >= value) {
    return undefined
  }
  return walletClient.writeContract({
    account: walletClient.account,
    chain: CHAIN_MAP[chainId],
    address: token,
    abi: [
      {
        inputs: [
          {
            internalType: 'address',
            name: 'spender',
            type: 'address',
          },
          {
            internalType: 'uint256',
            name: 'value',
            type: 'uint256',
          },
        ],
        name: 'approve',
        outputs: [
          {
            internalType: 'bool',
            name: '',
            type: 'bool',
          },
        ],
        stateMutability: 'nonpayable',
        type: 'function',
      },
    ] as const,
    functionName: 'approve',
    args: [CONTRACT_ADDRESSES[chainId]!.Controller, value],
  })
}
