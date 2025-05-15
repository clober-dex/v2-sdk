import { CHAIN_IDS } from '../constants/chain-configs/chain'
import { CONTRACT_ADDRESSES } from '../constants/chain-configs/addresses'
import { WETH_ADDRESS } from '../constants/chain-configs/currency'

/**
 * Get contract addresses by chain id
 * @param chainId - chain id from {@link CHAIN_IDS}
 * @returns Contract addresses
 *
 * @example
 * import { getContractAddresses } from '@clober/v2-sdk'
 *
 * const addresses = await getContractAddresses({
 *   chainId: 421614,
 * })
 */
export const getContractAddresses = ({ chainId }: { chainId: CHAIN_IDS }) => {
  return CONTRACT_ADDRESSES[chainId]
}

/**
 * Get Reference addresses for a given chain id
 * @param chainId - chain id from {@link CHAIN_IDS}
 * @returns Reference address
 *
 * @example
 * import { getReferenceTokenAddress } from '@clober/v2-sdk'
 *
 * const address = await getReferenceTokenAddress({
 *   chainId: 421614,
 * })
 */
export const getReferenceTokenAddress = ({
  chainId,
}: {
  chainId: CHAIN_IDS
}): `0x${string}` => {
  return WETH_ADDRESS[chainId]
}
