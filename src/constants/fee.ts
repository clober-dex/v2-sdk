import { FeePolicy } from '../model/fee-policy'

export const MAKER_DEFAULT_POLICY = new FeePolicy(true, -300n) // -0.03%
export const TAKER_DEFAULT_POLICY = new FeePolicy(true, 1000n) // 0.1%
