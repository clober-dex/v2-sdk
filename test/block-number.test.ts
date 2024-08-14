import { expect, test } from 'vitest'
import { getSubgraphBlockNumber } from '@clober/v2-sdk'
import { base } from 'viem/chains'

test('check latest subgraph block number functions', async () => {
  const blockNumber = await getSubgraphBlockNumber({
    chainId: base.id,
  })
  expect(Number(blockNumber)).toBeGreaterThan(0)
})
