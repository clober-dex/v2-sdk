import {
  createPublicClient,
  HDAccount,
  hexToSignature,
  http,
  parseUnits,
  PrivateKeyAccount,
  verifyTypedData,
  zeroHash,
} from 'viem'

import { CHAIN_IDS, CHAIN_MAP } from './constants/chain'
import { getDeadlineTimestampInSeconds } from './utils/time'
import { CONTRACT_ADDRESSES } from './constants/addresses'
import { fetchCurrency } from './apis/currency'
import { PermitSignature } from './type'

const _abi = [
  {
    inputs: [],
    name: 'version',
    outputs: [
      {
        internalType: 'string',
        name: '',
        type: 'string',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'owner',
        type: 'address',
      },
    ],
    name: 'nonces',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'name',
    outputs: [
      {
        internalType: 'string',
        name: '',
        type: 'string',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const

/**
 * Signs an ERC20 permit using EIP-712 encoding.
 *
 * @param {CHAIN_IDS} chainId The chain ID.
 * @param {HDAccount | PrivateKeyAccount} account The Ethereum account used for signing using
 * [viem - Local Accounts (Private Key, Mnemonic, etc)](https://viem.sh/docs/accounts/local#local-accounts-private-key-mnemonic-etc).
 * @param {`0x${string}`} token The ERC20 token address.
 * @param {string} amount The amount of tokens to permit.
 * @param options
 * @param options.rpcUrl The RPC URL of the blockchain.
 * @returns {Promise<PermitSignature>} Promise resolving to the permit signature.
 * @example
 * import { signERC20Permit } from '@clober-dex/v2-sdk'
 * import { privateKeyToAccount } from 'viem/accounts'
 *
 * const { deadline, r, s, v } = await getExpectedOutput(
 *   421614,
 *   privateKeyToAccount('0x...')
 *  '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
 *  '1000.123', // spend 1000.123 USDC
 * )
 *
 * @example
 * import { signERC20Permit } from '@clober-dex/v2-sdk'
 * import { mnemonicToAccount } from 'viem/accounts'
 *
 * const { deadline, r, s, v } = await getExpectedOutput(
 *   421614,
 *   mnemonicToAccount('legal ...')
 *  '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
 *  '1000.123', // spend 1000.123 USDC
 * )
 */
export const signERC20Permit = async (
  chainId: CHAIN_IDS,
  account: HDAccount | PrivateKeyAccount,
  token: `0x${string}`,
  amount: string,
  options?: {
    rpcUrl: string
  },
): Promise<PermitSignature> => {
  const currency = await fetchCurrency(chainId, token, options?.rpcUrl)
  const spender = CONTRACT_ADDRESSES[chainId]!.Controller
  const publicClient = createPublicClient({
    chain: CHAIN_MAP[chainId],
    transport: options?.rpcUrl ? http(options.rpcUrl) : http(),
  })
  const value = parseUnits(amount, currency.decimals)
  const [{ result: nonce }, { result: version }, { result: name }] =
    await publicClient.multicall({
      allowFailure: true,
      contracts: [
        {
          address: token,
          abi: _abi,
          functionName: 'nonces',
          args: [account.address],
        },
        {
          address: token,
          abi: _abi,
          functionName: 'version',
        },
        {
          address: token,
          abi: _abi,
          functionName: 'name',
        },
      ],
    })

  if (nonce === undefined || !name) {
    return {
      r: zeroHash,
      s: zeroHash,
      v: 0,
      deadline: 0n,
    }
  }
  const deadline = getDeadlineTimestampInSeconds()
  const data = {
    domain: {
      name: name,
      version: (version || '1').toString(),
      chainId: BigInt(chainId),
      verifyingContract: currency.address,
    },
    message: {
      owner: account.address,
      spender,
      value,
      nonce,
      deadline,
    },
    primaryType: 'Permit',
    types: {
      Permit: [
        { name: 'owner', type: 'address' },
        { name: 'spender', type: 'address' },
        { name: 'value', type: 'uint256' },
        { name: 'nonce', type: 'uint256' },
        { name: 'deadline', type: 'uint256' },
      ],
      EIP712Domain: [
        { name: 'name', type: 'string' },
        { name: 'version', type: 'string' },
        { name: 'chainId', type: 'uint256' },
        { name: 'verifyingContract', type: 'address' },
      ],
    },
  } as const
  const signature = await account.signTypedData({
    ...data,
  })
  const valid = await verifyTypedData({
    ...data,
    signature,
    address: account.address,
  })
  if (!valid) {
    throw new Error('Invalid signature')
  }
  const { v, s, r } = hexToSignature(signature)
  return {
    v: Number(v),
    s,
    r,
    deadline,
  }
}
