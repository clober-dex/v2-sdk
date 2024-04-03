import { startProxy } from '@viem/anvil'

import { FORK_URL, FORK_BLOCK_NUMBER, TEST_MNEMONIC } from '../utils/constants'

export default async function () {
  return startProxy({
    options: {
      forkUrl: FORK_URL,
      forkBlockNumber: FORK_BLOCK_NUMBER,
      mnemonic: TEST_MNEMONIC,
      accounts: 1,
      balance: 10000000000000000000, // 10 ETH
    },
  })
}
