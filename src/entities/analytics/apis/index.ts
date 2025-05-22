import { getAddress } from 'viem'

import { CHAIN_IDS } from '../../../constants/chain-configs/chain'
import { Subgraph } from '../../../constants/chain-configs/subgraph'
import {
  AnalyticsSummary,
  TopUser,
  TransactionType,
  UserVolumeSnapshot,
} from '../types'

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
  tokenDayData: TokenDayDataDto[]
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

const FUNCTION_SIG_MAP: Record<string, TransactionType> = {
  '0x7d773110': 'Limit',
  '0xfe815746': 'Limit',
  '0x8feb85b7': 'Claim',
  '0xa04c796b': 'Cancel',
  '0xc0e8e89a': 'Market',
  '0x4f28185a': 'Add-Liq',
  '0x0a31b953': 'Remove-Liq',
  '0x7e865aa4': 'Swap',
  '0xa0f15331': 'Unknown', // update position
  '0xed56531a': 'Unknown', // pause
  '0xf4dfd83a': 'Unknown', // arbitrage
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
    'query getDailyCloberSnapshot { cloberDayDatas(orderBy: date, orderDirection: asc) { date walletCount newWalletCount transactionTypes { type txCount } tokenDayData { volumeUSD totalValueLockedUSD protocolFeesUSD token { id name symbol decimals priceUSD } } } }',
    {},
  )

  const analyticsSnapshots = cloberDayDatas.map((item) => ({
    timestamp: item.date,
    activeUsers: Number(item.walletCount),
    firstTimeUsers: Number(item.newWalletCount),
    transactionTypeCounts: Object.fromEntries(
      item.transactionTypes.map((transactionType) => [
        FUNCTION_SIG_MAP[transactionType.type] ?? 'unknown',
        Number(transactionType.txCount),
      ]),
    ) as Record<TransactionType, number>,
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
    totalValueLockedUSD: item.tokenDayData.reduce(
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
          usd: Number(token.totalValueLockedUSD),
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
