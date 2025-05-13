// @dev: Withdraw amount calculation logic is based on the contract code.
import { createPublicClient, formatUnits, http, parseUnits } from 'viem'

import { CHAIN_IDS, CHAIN_MAP } from '../../constants/chain'
import {
  Currency6909Flow,
  CurrencyFlow,
  DefaultWriteContractOptions,
  Transaction,
} from '../../type'
import { fetchPool } from '../../entities/pool/apis'
import { applyPercent } from '../../utils/bigint'
import { buildTransaction } from '../../utils/build-transaction'
import { CONTRACT_ADDRESSES } from '../../constants/addresses'
import { REBALANCER_ABI } from '../../abis/rebalancer/rebalancer-abi'

export const removeLiquidity = async ({
  chainId,
  userAddress,
  token0,
  token1,
  salt,
  amount,
  options,
}: {
  chainId: CHAIN_IDS
  userAddress: `0x${string}`
  token0: `0x${string}`
  token1: `0x${string}`
  salt: `0x${string}`
  amount: string
  options?: {
    slippage?: number
    useSubgraph?: boolean
  } & DefaultWriteContractOptions
}): Promise<{
  transaction: Transaction | undefined
  result: {
    currencyA: CurrencyFlow
    currencyB: CurrencyFlow
    lpCurrency: Currency6909Flow
  }
}> => {
  const publicClient = createPublicClient({
    chain: CHAIN_MAP[chainId],
    transport: options?.rpcUrl ? http(options.rpcUrl) : http(),
  })
  const pool = await fetchPool(
    publicClient,
    chainId,
    [token0, token1],
    salt,
    !!(options && options.useSubgraph),
  )
  if (!pool.isOpened) {
    throw new Error(`
       Open the pool before removing liquidity.
       import { openPool } from '@clober/v2-sdk'

       const transaction = await openPool({
            chainId: ${chainId},
            tokenA: '${token0}',
            tokenB: '${token1}',
            salt: '0x0000000000000000000000000000000000000000000000000000000000000000',
       })
    `)
  }
  const burnAmount = parseUnits(amount, pool.currencyLp.decimals)
  const slippageLimitPercent = options?.slippage ?? 2
  const withdrawAmountA = (burnAmount * pool.liquidityA) / pool.totalSupply
  const withdrawAmountB = (burnAmount * pool.liquidityB) / pool.totalSupply
  const minWithdrawAmountA = applyPercent(
    withdrawAmountA,
    100 - slippageLimitPercent,
  )
  const minWithdrawAmountB = applyPercent(
    withdrawAmountB,
    100 - slippageLimitPercent,
  )

  if (burnAmount === 0n) {
    return {
      transaction: undefined,
      result: {
        currencyA: {
          currency: pool.currencyA,
          amount: '0',
          direction: 'out',
        },
        currencyB: {
          currency: pool.currencyB,
          amount: '0',
          direction: 'out',
        },
        lpCurrency: {
          currency: pool.currencyLp,
          amount: '0',
          direction: 'in',
        },
      },
    }
  }

  const transaction = await buildTransaction(
    publicClient,
    {
      chain: CHAIN_MAP[chainId],
      account: userAddress,
      address: CONTRACT_ADDRESSES[chainId]!.Rebalancer,
      abi: REBALANCER_ABI,
      functionName: 'burn',
      args: [pool.key, burnAmount, minWithdrawAmountA, minWithdrawAmountB],
    },
    options?.gasLimit,
  )

  return {
    transaction,
    result: {
      currencyA: {
        currency: pool.currencyA,
        amount: formatUnits(withdrawAmountA, pool.currencyA.decimals),
        direction: 'out',
      },
      currencyB: {
        currency: pool.currencyB,
        amount: formatUnits(withdrawAmountB, pool.currencyB.decimals),
        direction: 'out',
      },
      lpCurrency: {
        currency: pool.currencyLp,
        amount: amount,
        direction: 'in',
      },
    },
  }
}
