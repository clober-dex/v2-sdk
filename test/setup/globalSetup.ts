import { startProxy } from '@viem/anvil'

import { FORK_URL, TEST_MNEMONIC } from '../utils/constants'
import { cloberTestChain } from '../utils/test-chain'
import { fetchBlockNumer } from '../utils/chain'

export default async function () {
  const forkBlockNumber = await fetchBlockNumer()
  return startProxy({
    options: {
      chainId: cloberTestChain.id,
      forkUrl: FORK_URL,
      forkBlockNumber,
      mnemonic: TEST_MNEMONIC,
      accounts: 1,
      balance: 1000, // 1000 ETH
      gasPrice: 0n,
    },
  })
}
