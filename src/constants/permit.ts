import { zeroHash } from 'viem'

export const EMPTY_ERC20_PERMIT_PARAMS = {
  permitAmount: 0n,
  signature: {
    deadline: 0n,
    v: 0,
    r: zeroHash,
    s: zeroHash,
  },
}
