import { getAddress } from 'viem'

import { CHAIN_IDS } from '../../../constants/chain-configs/chain'
import { Subgraph } from '../../../constants/chain-configs/subgraph'
import {
  AnalyticsSummary,
  TopUser,
  TransactionType,
  UserVolumeSnapshot,
} from '../types'
import { convertTokenToDecimal } from '../../../utils/bigint'

type TokenDayDataDto = {
  volumeUSD: string
  totalValueLockedUSD: string
  protocolFeesUSD: string
  token: {
    id: string
    name: string
    symbol: string
    decimals: string
    priceUSD: string
  }
}

type CloberDayDataDTO = {
  date: number
  walletCount: string
  newWalletCount: string
  transactionTypes: {
    type: string
    txCount: string
  }[]
  routerDayData: {
    router: `0x${string}`
    txCount: string
  }[]
  tokenDayData: TokenDayDataDto[]
}

type PoolDayDataDTO = {
  date: number
  liquidityA: string
  liquidityB: string
  totalValueLockedUSD: string
}

type TokenDayDataDTO = {
  date: number
  priceUSD: string
}

type PoolDTO = {
  id: string
  tokenA: {
    id: string
    name: string
    symbol: string
    decimals: string
    tokenDayData: TokenDayDataDTO[]
  }
  tokenB: {
    id: string
    name: string
    symbol: string
    decimals: string
    tokenDayData: TokenDayDataDTO[]
  }
  poolDayData: PoolDayDataDTO[]
}

type UserDayDatasDTO = {
  date: number
  volumes: {
    volumeUSD: string
    token: {
      id: string
      name: string
      symbol: string
      decimals: string
    }
  }[]
}

type TopUserDTO = {
  id: string
  firstSeenTimestamp: string
  firstSeenBlockNumber: string
  nativeVolume: string
}

const UNKNOWN = 'Unknown'

const FUNCTION_SIG_MAP: Record<string, TransactionType> = {
  '0x7d773110': 'Limit', // make
  '0xfe815746': 'Limit', // limit
  '0xb305b94c': 'Limit', // make
  '0x08b2c1d8': 'Limit', // limit
  '0x8feb85b7': 'Claim',
  '0xa04c796b': 'Cancel',
  '0xc0e8e89a': 'Market',
  '0x4f28185a': 'Add-Liq',
  '0x0a31b953': 'Remove-Liq',
  '0x7e865aa4': 'Swap',
  '0xb69cbf9f': 'Swap', // swap with min amount out
  '0x5973bd5e': 'Swap', // swap with fee
  '0xa0f15331': UNKNOWN, // update position
  '0xed56531a': UNKNOWN, // pause
  '0xf4dfd83a': UNKNOWN, // arbitrage
}

export async function fetchProtocolAnalytics(
  chainId: CHAIN_IDS,
): Promise<AnalyticsSummary> {
  const {
    data: { cloberDayDatas },
  } = await Subgraph.get<{
    data: {
      cloberDayDatas: CloberDayDataDTO[]
    }
  }>(
    chainId,
    'getDailyCloberSnapshot',
    'query getDailyCloberSnapshot { cloberDayDatas(first: 1000, orderBy: date, orderDirection: asc) { date walletCount newWalletCount transactionTypes { type txCount } routerDayData { router txCount } tokenDayData { volumeUSD totalValueLockedUSD protocolFeesUSD token { id name symbol decimals priceUSD } } } }',
    {},
  )

  const {
    data: { pools },
  } = await Subgraph.get<{
    data: {
      pools: PoolDTO[]
    }
  }>(
    chainId,
    'getDailyPoolSnapshot',
    'query getDailyPoolSnapshot { pools { id tokenA { id name symbol decimals tokenDayData(first: 1000, orderBy: date, orderDirection: desc) { date priceUSD } } tokenB { id name symbol decimals tokenDayData(first: 1000, orderBy: date, orderDirection: desc) { date priceUSD } } poolDayData(first: 1000, orderBy: date, orderDirection: desc) { date liquidityA liquidityB totalValueLockedUSD } } }',
    {},
  )

  const poolTvlMap: Record<
    number,
    {
      usd: number
      tvlMap: Record<`0x${string}`, number>
    }
  > = pools.reduce(
    (acc, pool) => {
      pool.poolDayData.forEach((poolDayData) => {
        const date = poolDayData.date
        if (!acc[date]) {
          acc[date] = {
            usd: 0,
            tvlMap: {},
          }
        }
        acc[date].usd += Number(poolDayData.totalValueLockedUSD)
        const tokenA = getAddress(pool.tokenA.id)
        const tokenAPriceUSD = Number(
          pool.tokenA.tokenDayData.find((item) => item.date === date)
            ?.priceUSD ?? '0',
        )
        const tokenB = getAddress(pool.tokenB.id)
        const tokenBPriceUSD = Number(
          pool.tokenB.tokenDayData.find((item) => item.date === date)
            ?.priceUSD ?? '0',
        )

        if (!acc[date].tvlMap[tokenA]) {
          acc[date].tvlMap[tokenA] = 0
        }
        if (!acc[date].tvlMap[tokenB]) {
          acc[date].tvlMap[tokenB] = 0
        }
        acc[date].tvlMap[tokenA] +=
          convertTokenToDecimal(
            BigInt(poolDayData.liquidityA),
            Number(pool.tokenA.decimals),
          ) * tokenAPriceUSD
        acc[date].tvlMap[tokenB] +=
          convertTokenToDecimal(
            BigInt(poolDayData.liquidityB),
            Number(pool.tokenB.decimals),
          ) * tokenBPriceUSD
      })
      return acc
    },
    {} as Record<
      number,
      { usd: number; tvlMap: Record<`0x${string}`, number> }
    >,
  )

  const analyticsSnapshots = cloberDayDatas.map((item) => ({
    timestamp: item.date,
    activeUsers: Number(item.walletCount),
    firstTimeUsers: Number(item.newWalletCount),
    transactionTypeCounts: item.transactionTypes.reduce(
      (acc, transactionType) => {
        const key = FUNCTION_SIG_MAP[transactionType.type] ?? UNKNOWN
        const count = Number(transactionType.txCount)
        acc[key] = (acc[key] ?? 0) + count
        return acc
      },
      {} as Record<TransactionType, number>,
    ),
    routerCounts: item.routerDayData.reduce(
      (acc, router) => {
        acc[getAddress(router.router)] =
          (acc[getAddress(router.router)] ?? 0) + Number(router.txCount)
        return acc
      },
      {} as Record<`0x${string}`, number>,
    ),
    volume24hUSD: item.tokenDayData.reduce(
      (acc, token) => acc + Number(token.volumeUSD),
      0,
    ),
    volume24hUSDMap: Object.fromEntries(
      item.tokenDayData.map((token) => [
        getAddress(token.token.id),
        {
          currency: {
            address: getAddress(token.token.id),
            name: token.token.name,
            symbol: token.token.symbol,
            decimals: Number(token.token.decimals),
          },
          usd: Number(token.volumeUSD),
        },
      ]),
    ),
    protocolFees24hUSD: item.tokenDayData.reduce(
      (acc, token) => acc + Number(token.protocolFeesUSD),
      0,
    ),
    protocolFees24hUSDMap: Object.fromEntries(
      item.tokenDayData.map((token) => [
        getAddress(token.token.id),
        {
          currency: {
            address: getAddress(token.token.id),
            name: token.token.name,
            symbol: token.token.symbol,
            decimals: Number(token.token.decimals),
          },
          usd: Number(token.protocolFeesUSD),
        },
      ]),
    ),
    poolTotalValueLockedUSD: poolTvlMap?.[item.date]?.usd ?? 0,
    poolTotalValueLockedUSDMap: Object.fromEntries(
      item.tokenDayData.map((token) => [
        getAddress(token.token.id),
        {
          currency: {
            address: getAddress(token.token.id),
            name: token.token.name,
            symbol: token.token.symbol,
            decimals: Number(token.token.decimals),
          },
          usd: Number(
            poolTvlMap?.[item.date]?.tvlMap?.[getAddress(token.token.id)] ?? 0,
          ),
        },
      ]),
    ),
    totalValueLockedUSD:
      (poolTvlMap?.[item.date]?.usd ?? 0) +
      item.tokenDayData.reduce(
        (acc, token) => acc + Number(token.totalValueLockedUSD),
        0,
      ),
    totalValueLockedUSDMap: Object.fromEntries(
      item.tokenDayData.map((token) => [
        getAddress(token.token.id),
        {
          currency: {
            address: getAddress(token.token.id),
            name: token.token.name,
            symbol: token.token.symbol,
            decimals: Number(token.token.decimals),
          },
          usd:
            Number(token.totalValueLockedUSD) +
            Number(
              poolTvlMap?.[item.date]?.tvlMap?.[getAddress(token.token.id)] ??
                0,
            ),
        },
      ]),
    ),
  }))
  return {
    accumulatedUniqueUsers: analyticsSnapshots.reduce(
      (acc, item) => acc + item.firstTimeUsers,
      0,
    ),
    accumulatedUniqueTransactions: analyticsSnapshots.reduce(
      (acc, item) =>
        acc +
        Object.values(item.transactionTypeCounts).reduce(
          (acc, item) => acc + item,
          0,
        ),
      0,
    ),
    accumulatedVolumeUSD: analyticsSnapshots.reduce(
      (acc, item) => acc + item.volume24hUSD,
      0,
    ),
    accumulatedProtocolFeesUSD: analyticsSnapshots.reduce(
      (acc, item) => acc + item.protocolFees24hUSD,
      0,
    ),
    analyticsSnapshots,
  }
}

export async function fetchUserVolumeSnapshots(
  chainId: CHAIN_IDS,
  userAddress: `0x${string}`,
): Promise<UserVolumeSnapshot[]> {
  const {
    data: { userDayDatas },
  } = await Subgraph.get<{
    data: {
      userDayDatas: UserDayDatasDTO[]
    }
  }>(
    chainId,
    'getDailyUserSnapshot',
    'query getDailyUserSnapshot($user: Bytes!) { userDayDatas(where: {user: $user}) { date volumes { volumeUSD token { id name symbol decimals } } } }',
    {
      user: userAddress.toLowerCase(),
    },
  )

  return userDayDatas.map((item) => ({
    timestamp: item.date,
    volume24hUSD: item.volumes.reduce(
      (acc, volume) => acc + Number(volume.volumeUSD),
      0,
    ),
    volume24hUSDMap: Object.fromEntries(
      item.volumes.map((volume) => [
        getAddress(volume.token.id),
        {
          currency: {
            address: getAddress(volume.token.id),
            name: volume.token.name,
            symbol: volume.token.symbol,
            decimals: Number(volume.token.decimals),
          },
          usd: Number(volume.volumeUSD),
        },
      ]),
    ),
  }))
}

export async function fetchTopUsersByNativeVolume(
  chainId: CHAIN_IDS,
): Promise<TopUser[]> {
  const {
    data: { users },
  } = await Subgraph.get<{
    data: {
      users: TopUserDTO[]
    }
  }>(
    chainId,
    'getTopUsersByNativeVolume',
    'query getTopUsersByNativeVolume { users(first: 1000, orderBy: nativeVolume, orderDirection: desc) { id firstSeenTimestamp firstSeenBlockNumber nativeVolume } }',
    {},
  )

  return users.map(
    (item) =>
      ({
        address: getAddress(item.id),
        firstSeenTimestamp: Number(item.firstSeenTimestamp),
        firstSeenBlockNumber: Number(item.firstSeenBlockNumber),
        nativeVolume: Number(item.nativeVolume),
      }) as TopUser,
  )
}

export async function fetchUserNativeVolume(
  chainId: CHAIN_IDS,
  userAddress: `0x${string}`,
): Promise<number> {
  const {
    data: { user },
  } = await Subgraph.get<{
    data: {
      user: {
        id: string
        nativeVolume: string
      }
    }
  }>(
    chainId,
    'getUserNativeVolume',
    'query getUserNativeVolume($user: ID!) { user(id: $user) { nativeVolume } }',
    {
      user: userAddress.toLowerCase(),
    },
  )

  return Number(user.nativeVolume)
}
