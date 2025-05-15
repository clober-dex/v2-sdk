import { expect, test } from 'vitest'
import { getSubgraphBlockNumber } from '@clober/v2-sdk'
import { arbitrumSepolia } from 'viem/chains'

test('check latest subgraph block number functions', async () => {
  const blockNumber = await getSubgraphBlockNumber({
    chainId: arbitrumSepolia.id,
  })
  expect(Number(blockNumber)).toBeGreaterThan(0)
})
