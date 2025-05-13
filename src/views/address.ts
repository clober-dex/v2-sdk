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
