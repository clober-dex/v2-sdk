import {
  createPublicClient,
  createTestClient,
  createWalletClient,
  http,
} from 'viem'

import { cloberTestChain } from './test-chain'

type TupleOf<T, N extends number, R extends unknown[]> = R['length'] extends N
  ? R
  : TupleOf<T, N, [T, ...R]>

export type Tuple<T, N extends number> = N extends N
  ? number extends N
    ? T[]
    : TupleOf<T, N, []>
  : never

export function createProxyClients<const TIds extends readonly number[]>(
  ids: TIds,
  port = 8545,
) {
  const output = ids.map((i) => {
    const publicClient = createPublicClient({
      chain: cloberTestChain,
      transport: http(`http://127.0.0.1:${port}/${i}`),
    })

    const testClient = createTestClient({
      chain: cloberTestChain,
      mode: 'anvil',
      transport: http(`http://127.0.0.1:${port}/${i}`),
    })

    const walletClient = createWalletClient({
      chain: cloberTestChain,
      transport: http(`http://127.0.0.1:${port}/${i}`),
    })

    return { publicClient, testClient, walletClient } as const
  })

  return output as Tuple<(typeof output)[number], TIds['length']>
}
