import { hexToSignature, parseUnits, verifyTypedData, WalletClient } from 'viem'

import { CHAIN_IDS } from './constants/chain'
import { getDeadlineTimestampInSeconds } from './utils/time'
import { CONTRACT_ADDRESSES } from './constants/addresses'
import { fetchCurrency } from './utils/currency'
import { DefaultOptions, ERC20PermitParam } from './type'
import { cachedPublicClients } from './constants/client'
import { decorator } from './utils/decorator'

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
 * @dev This function relates with `viem` dependency
 * Signs an ERC20 permit using EIP-712 encoding.
 *
 * @param {CHAIN_IDS} chainId The chain ID.
 * @param {WalletClient} walletClient The wallet client.
 * @param {`0x${string}`} token The ERC20 token address.
 * @param {string} amount The amount of tokens to permit.
 * @param options
 * @param options.rpcUrl The RPC URL of the blockchain.
 * @returns {Promise<erc20PermitParam | undefined>} The signed permit.
 * @example
 * import { signERC20Permit } from '@clober/v2-sdk'
 *
 * const walletClient = createWalletClient({
 *   chain: arbitrumSepolia,
 *   account: mnemonicToAccount('legal ...'),
 *   transport: http(),
 * })
 *
 * const { deadline, r, s, v } = await signERC20Permit({
 *   chainId: 421614,
 *   walletClient
 *   token: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
 *   amount: '1000.123', // spend 1000.123 USDC
 * })
 */
export const signERC20Permit = decorator(
  async ({
    chainId,
    walletClient,
    token,
    amount,
  }: {
    chainId: CHAIN_IDS
    walletClient: WalletClient
    token: `0x${string}`
    amount: string
    options?: DefaultOptions
  }): Promise<ERC20PermitParam | undefined> => {
    if (!walletClient.account) {
      throw new Error('Account is not found')
    }
    const currency = await fetchCurrency(chainId, token)
    const spender = CONTRACT_ADDRESSES[chainId]!.Controller
    const value = parseUnits(amount, currency.decimals)
    const owner = walletClient.account.address
    const [{ result: nonce }, { result: version }, { result: name }] =
      await cachedPublicClients[chainId].multicall({
        allowFailure: true,
        contracts: [
          {
            address: token,
            abi: _abi,
            functionName: 'nonces',
            args: [owner],
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
      return undefined
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
        owner,
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
    const signature = await walletClient.signTypedData({
      ...data,
      account: walletClient.account,
    })
    const valid = await verifyTypedData({
      ...data,
      signature,
      address: owner,
    })
    if (!valid) {
      throw new Error('Invalid signature')
    }
    const { v, s, r } = hexToSignature(signature)
    return {
      token,
      permitAmount: value,
      signature: {
        v: Number(v),
        s,
        r,
        deadline,
      },
    }
  },
)
