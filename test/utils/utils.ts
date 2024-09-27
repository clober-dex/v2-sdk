import {
  createPublicClient,
  createTestClient,
  createWalletClient,
  http,
} from 'viem'

import {
  cloberTestChain,
  cloberTestChain2,
} from '../../src/constants/test-chain'

import { account } from './constants'

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
      account,
      transport: http(`http://127.0.0.1:${port}/${i}`),
    })

    return { publicClient, testClient, walletClient } as const
  })

  return output as Tuple<(typeof output)[number], TIds['length']>
}

export function createProxyClients2<const TIds extends readonly number[]>(
  ids: TIds,
  port = 8546,
) {
  const output = ids.map((i) => {
    const publicClient = createPublicClient({
      chain: cloberTestChain2,
      transport: http(`http://127.0.0.1:${port}/${i}`),
    })

    const testClient = createTestClient({
      chain: cloberTestChain2,
      mode: 'anvil',
      transport: http(`http://127.0.0.1:${port}/${i}`),
    })

    const walletClient = createWalletClient({
      chain: cloberTestChain2,
      account,
      transport: http(`http://127.0.0.1:${port}/${i}`),
    })

    return { publicClient, testClient, walletClient } as const
  })

  return output as Tuple<(typeof output)[number], TIds['length']>
}
