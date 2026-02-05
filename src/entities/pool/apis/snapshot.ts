import { formatUnits, getAddress, isAddressEqual } from 'viem'
import BigNumber from 'bignumber.js'

import { CHAIN_IDS } from '../../../constants/chain-configs/chain'
import { Currency, PoolSnapshot } from '../../../types'
import { Subgraph } from '../../../constants/chain-configs/subgraph'
import { getContractAddresses } from '../../../views'
import { UserPoolPosition } from '../types'
import { STABLE_COINS } from '../../../constants/chain-configs/currency'

type PoolDto = {
  id: string
  salt: string
  tokenA: {
    id: string
    name: string
    symbol: string
    decimals: string
    tokenDayData: {
      date: number
      priceUSD: string
    }[]
  }
  tokenB: {
    id: string
    name: string
    symbol: string
    decimals: string
    tokenDayData: {
      date: number
      priceUSD: string
    }[]
  }
  initialTotalSupply: string
  initialTokenAAmount: string
  initialTokenBAmount: string
  initialLPPriceUSD: string
  createdAtTimestamp: string
  createdAtTransaction: {
    id: string
  }
  totalValueLockedUSD: string
  totalSupply: string
  volumeUSD: string
  lpPriceUSD: string
  spreadProfitUSD: string
}

type PoolPeriodDataDto = {
  date: number
  totalValueLockedUSD: string
  totalSupply: string
  spreadProfitUSD: string
  lpPriceUSD: string
  oraclePrice: string
  priceA: string
  priceB: string
  volumeTokenA: string
  volumeTokenB: string
  volumeUSD: string
}

export const fetchPoolSnapshotFromSubgraph = async (
  chainId: CHAIN_IDS,
  poolKey: `0x${string}`,
  prices: Record<`0x${string}`, number>,
): Promise<PoolSnapshot | null> => {
  const {
    data: { pool, poolDayDatas, poolHourDatas },
  } = await Subgraph.get<{
    data: {
      pool: PoolDto | null
      poolDayDatas: PoolPeriodDataDto[]
      poolHourDatas: PoolPeriodDataDto[]
    }
  }>(
    chainId,
    'getPoolSnapshot',
    'query getPoolSnapshot($poolKey: ID!) { pool(id: $poolKey) { id salt tokenA { id name symbol decimals tokenDayData(orderBy: date, orderDirection: asc) { date priceUSD } } tokenB { id name symbol decimals tokenDayData(orderBy: date, orderDirection: asc) { date priceUSD } } initialTotalSupply initialTokenAAmount initialTokenBAmount initialLPPriceUSD createdAtTimestamp createdAtTransaction { id } totalValueLockedUSD totalSupply volumeUSD lpPriceUSD spreadProfitUSD } poolDayDatas( where: {pool: $poolKey, oraclePrice_gt: 0} orderBy: date orderDirection: desc first: 1000 ) { date totalValueLockedUSD totalSupply spreadProfitUSD lpPriceUSD oraclePrice priceA priceB volumeTokenA volumeTokenB volumeUSD } poolHourDatas( where: {pool: $poolKey, oraclePrice_gt: 0} orderBy: date orderDirection: desc first: 24 ) { date totalValueLockedUSD totalSupply spreadProfitUSD lpPriceUSD oraclePrice priceA priceB volumeTokenA volumeTokenB volumeUSD } }',
    {
      poolKey: poolKey.toLowerCase(),
    },
  )
  if (!pool) {
    return null
  }
  const currencyA: Currency = {
    address: getAddress(pool.tokenA.id),
    name: pool.tokenA.name,
    symbol: pool.tokenA.symbol,
    decimals: Number(pool.tokenA.decimals),
  }
  const currencyAPrice =
    prices?.[pool.tokenA.id.toLowerCase() as `0x${string}`] ?? 0
  const currencyB: Currency = {
    address: getAddress(pool.tokenB.id),
    name: pool.tokenB.name,
    symbol: pool.tokenB.symbol,
    decimals: Number(pool.tokenB.decimals),
  }
  const currencyBPrice =
    prices?.[pool.tokenB.id.toLowerCase() as `0x${string}`] ?? 0
  const lpCurrency = {
    id: pool.id as `0x${string}`,
    address: getContractAddresses({ chainId }).Rebalancer,
    name: `Clober Liquidity Vault ${currencyB.symbol}-${currencyA.symbol}`,
    symbol: `CLV-${currencyB.symbol}-${currencyA.symbol}`,
    decimals: 18,
  }
  const initialTokenAAmount = formatUnits(
    BigInt(pool.initialTokenAAmount),
    Number(pool.tokenA.decimals),
  )
  const initialTokenBAmount = formatUnits(
    BigInt(pool.initialTokenBAmount),
    Number(pool.tokenB.decimals),
  )
  const isQuoteStable = (STABLE_COINS[chainId] ?? []).some((stableCoin) =>
    isAddressEqual(stableCoin.address, currencyA.address),
  )
  const initialTotalSupply = formatUnits(BigInt(pool.initialTotalSupply), 18)
  const performanceHistories = poolDayDatas
    .map((poolDayData, index) => {
      const priceAUSD =
        index === 0 && currencyAPrice
          ? currencyAPrice.toString()
          : isQuoteStable
            ? '1'
            : pool.tokenA.tokenDayData.find(
                ({ date }) => date === poolDayData.date,
              )?.priceUSD ?? '0'

      const priceBUSD =
        index === 0 && currencyBPrice
          ? currencyBPrice.toString()
          : isQuoteStable
            ? poolDayData.priceB
            : pool.tokenB.tokenDayData.find(
                ({ date }) => date === poolDayData.date,
              )?.priceUSD ?? '0'

      const onHoldUSDValuePerLp = new BigNumber(initialTokenAAmount)
        .multipliedBy(priceAUSD)
        .plus(new BigNumber(initialTokenBAmount).multipliedBy(priceBUSD))
        .dividedBy(initialTotalSupply)
        .toString()

      return {
        timestamp: poolDayData.date,
        spreadProfitUSD: poolDayData.spreadProfitUSD,
        tvlUSD: poolDayData.totalValueLockedUSD,
        lpPriceUSD: poolDayData.lpPriceUSD,
        oraclePrice: poolDayData.oraclePrice,
        priceA: poolDayData.priceA,
        priceAUSD,
        priceB: poolDayData.priceB,
        priceBUSD,
        volumeA: {
          currency: currencyA,
          value: poolDayData.volumeTokenA,
        },
        volumeB: {
          currency: currencyB,
          value: poolDayData.volumeTokenB,
        },
        onHoldUSDValuePerLp,
        volumeUSD: poolDayData.volumeUSD,
        relativePriceIndex:
          Number(poolDayData.lpPriceUSD) / Number(onHoldUSDValuePerLp),
        performanceIndex:
          Number(poolDayData.lpPriceUSD) / Number(pool.initialLPPriceUSD),
      }
    })
    .sort((a, b) => a.timestamp - b.timestamp)
  if (performanceHistories.length > 1) {
    performanceHistories[0].performanceIndex = 1
    performanceHistories[0].relativePriceIndex = 1
  }
  const now = Math.floor(Date.now() / 1000)
  const before24h = now - 24 * 60 * 60
  return {
    chainId,
    key: poolKey,
    salt: pool.salt as `0x${string}`,
    initialLPInfo: {
      currencyA: {
        currency: currencyA,
        value: initialTokenAAmount,
      },
      currencyB: {
        currency: currencyB,
        value: initialTokenBAmount,
      },
      lpToken: {
        currency: lpCurrency,
        value: initialTotalSupply,
      },
      lpPriceUSD: pool.initialLPPriceUSD,
      timestamp: Number(pool.createdAtTimestamp),
      txHash: pool.createdAtTransaction.id as `0x${string}`,
    },
    currencyA,
    currencyB,
    lpCurrency,
    volumeUSD24h: poolHourDatas
      .filter((data) => data.date >= before24h)
      .reduce((acc, data) => acc + Number(data.volumeUSD), 0)
      .toString(),
    lpPriceUSD: pool.lpPriceUSD,
    totalTvlUSD: pool.totalValueLockedUSD,
    totalSpreadProfitUSD: pool.spreadProfitUSD,
    currentPerformanceIndex:
      performanceHistories?.[performanceHistories.length - 1]
        ?.performanceIndex || 0,
    currentRelativePriceIndex:
      performanceHistories?.[performanceHistories.length - 1]
        ?.relativePriceIndex || 0,
    performanceHistories,
  }
}

export const fetchPoolSnapshotsFromSubgraph = async (
  chainId: CHAIN_IDS,
  prices: Record<`0x${string}`, number>,
): Promise<PoolSnapshot[]> => {
  const {
    data: { pools },
  } = await Subgraph.get<{
    data: {
      pools: {
        id: string
      }[]
    }
  }>(chainId, 'getPoolKeys', 'query getPoolKeys { pools { id } }', {})
  return Promise.all(
    pools.map(async (pool) => {
      return fetchPoolSnapshotFromSubgraph(
        chainId,
        pool.id as `0x${string}`,
        prices,
      )
    }),
  ) as Promise<PoolSnapshot[]>
}

export const fetchUserPoolPositionsFromSubgraph = async (
  chainId: CHAIN_IDS,
  userAddress: `0x${string}`,
  prices: Record<`0x${string}`, number>,
): Promise<UserPoolPosition[]> => {
  const {
    data: { userPoolBalances },
  } = await Subgraph.get<{
    data: {
      userPoolBalances: {
        user: { id: string }
        lpBalance: string
        pool: {
          id: string
          salt: string
          totalSupply: string
          liquidityA: string
          liquidityB: string
          tokenA: { id: string; decimals: string; symbol: string; name: string }
          tokenB: { id: string; decimals: string; symbol: string; name: string }
        }
        lpBalanceUSD: string
        averageLPPriceUSD: string
      }[]
    }
  }>(
    chainId,
    'getUserPoolBalances',
    'query getUserPoolBalances($userAddress: String!) { userPoolBalances(where: {user: $userAddress}) { user { id } lpBalance pool { id salt totalSupply liquidityA liquidityB tokenA { id decimals symbol name } tokenB { id decimals symbol name } } lpBalanceUSD averageLPPriceUSD } }',
    {
      userAddress: userAddress.toLowerCase(),
    },
  )
  return userPoolBalances.map(
    ({ user, averageLPPriceUSD, lpBalance: _lpBalance, pool }) => {
      const lpBalance = Number(formatUnits(BigInt(_lpBalance), 18))
      const currencyA = {
        address: getAddress(pool.tokenA.id),
        name: pool.tokenA.name,
        symbol: pool.tokenA.symbol,
        decimals: Number(pool.tokenA.decimals),
      }
      const currencyB = {
        address: getAddress(pool.tokenB.id),
        name: pool.tokenB.name,
        symbol: pool.tokenB.symbol,
        decimals: Number(pool.tokenB.decimals),
      }
      const totalSupply = Number(formatUnits(BigInt(pool.totalSupply), 18))
      const liquidityA = Number(
        formatUnits(BigInt(pool.liquidityA), Number(pool.tokenA.decimals)),
      )
      const liquidityAInUSD =
        liquidityA *
        (prices?.[currencyA.address.toLowerCase() as `0x${string}`] ?? 0)
      const liquidityB = Number(
        formatUnits(BigInt(pool.liquidityB), Number(pool.tokenB.decimals)),
      )
      const liquidityBInUSD =
        liquidityB *
        (prices?.[currencyB.address.toLowerCase() as `0x${string}`] ?? 0)
      const lpPrice = (liquidityAInUSD + liquidityBInUSD) / totalSupply
      return {
        chainId,
        key: pool.id as `0x${string}`,
        salt: pool.salt as `0x${string}`,
        currencyA,
        currencyB,
        userAddress: getAddress(user.id) as `0x${string}`,
        averageLPPriceUSD,
        lpBalance: lpBalance.toString(),
        lpBalanceUSD: (lpBalance * lpPrice).toString(),
        pnlUSD: (lpBalance * (lpPrice - Number(averageLPPriceUSD))).toString(),
      }
    },
  )
}
