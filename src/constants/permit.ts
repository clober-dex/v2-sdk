import { zeroHash } from 'viem'

export const emptyERC20PermitParams = {
  permitAmount: 0n,
  signature: {
    deadline: 0n,
    v: 0,
    r: zeroHash,
    s: zeroHash,
  },
}
