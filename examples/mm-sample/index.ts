import {
  createPublicClient,
  createWalletClient,
  getAddress,
  http,
  isAddress,
  type Chain,
  isAddressEqual,
} from 'viem'
import * as chains from 'viem/chains'
import {
  approveERC20,
  getMarket,
  getOpenOrders,
  parseMakeOrderIdsFromReceipt,
  placeMarketMakingQuotes,
} from '@clober/v2-sdk'
import { privateKeyToAccount } from 'viem/accounts'

const validateEnv = () => {
  if (!process.env.BINANCE_MARKET_ID) {
    throw new Error('Invalid BINANCE_MARKET_ID environment variable')
  }
  if (!process.env.CHAIN_ID || isNaN(parseInt(process.env.CHAIN_ID))) {
    throw new Error('Invalid CHAIN_ID environment variable')
  }
  if (!process.env.TOKEN0 || !isAddress(process.env.TOKEN0)) {
    throw new Error('Invalid TOKEN0 environment variable')
  }
  if (!process.env.TOKEN1 || !isAddress(process.env.TOKEN1)) {
    throw new Error('Invalid TOKEN1 environment variable')
  }
  if (!process.env.RPC_URL || !/^https?:\/\/.+/.test(process.env.RPC_URL)) {
    throw new Error('Invalid RPC_URL environment variable')
  }
  if (!process.env.PRIVATE_KEY) {
    throw new Error('Invalid PRIVATE_KEY environment variable')
  }
  const checkDepth = (name: 'ASK' | 'BID') => {
    try {
      const parsed = JSON.parse(process.env[name]!)
      if (
        !Array.isArray(parsed) ||
        !parsed.every(
          (e) =>
            Array.isArray(e) &&
            e.length === 2 &&
            typeof e[0] === 'number' &&
            typeof e[1] === 'number',
        )
      ) {
        throw new Error()
      }
    } catch {
      throw new Error(
        `${name} must be a valid JSON array like [[1.001, 2], [1.002, 3]]`,
      )
    }
  }

  checkDepth('ASK')
  checkDepth('BID')
}

const fetchBinanceMarketPrice = async (
  binanceMarketId: string,
): Promise<number> => {
  try {
    const response = await fetch(
      `https://www.binance.com/api/v3/ticker/price?symbol=${binanceMarketId}`,
    )
    const { price } = (await response.json()) as {
      symbol: string
      price: string
    }
    return parseFloat(price)
  } catch (e) {
    throw new Error(
      `Failed to fetch Binance market price for ${binanceMarketId}: ${e}`,
    )
  }
}

const main = async () => {
  validateEnv()

  const [chain, token0, token1, rpcUrl, bidConfig, askConfig]: [
    Chain,
    `0x${string}`,
    `0x${string}`,
    string,
    [number, number][],
    [number, number][],
  ] = [
    Object.values(chains).find(
      (chain) => chain.id === parseInt(process.env.CHAIN_ID!),
    )!,
    getAddress(process.env.TOKEN0!),
    getAddress(process.env.TOKEN1!),
    process.env.RPC_URL!,
    JSON.parse(process.env.BID! || '[]') as [number, number][],
    JSON.parse(process.env.ASK! || '[]') as [number, number][],
  ]

  const walletClient = createWalletClient({
    chain,
    transport: http(rpcUrl),
    account: privateKeyToAccount(process.env.PRIVATE_KEY! as `0x${string}`),
  })
  const publicClient = createPublicClient({
    chain,
    transport: http(rpcUrl),
  })

  // step 1: Approve tokens to Clober Controller
  await approveERC20({
    chainId: chain.id,
    walletClient,
    token: token0,
    options: {
      rpcUrl,
    },
  }).then((hash) =>
    hash ? publicClient.waitForTransactionReceipt({ hash }) : undefined,
  )

  await approveERC20({
    chainId: chain.id,
    walletClient,
    token: token1,
    options: {
      rpcUrl,
    },
  }).then((hash) =>
    hash ? publicClient.waitForTransactionReceipt({ hash }) : undefined,
  )

  const market = await getMarket({
    chainId: chain.id,
    token0,
    token1,
    options: {
      rpcUrl,
      useSubgraph: false,
    },
  })

  // step 2: Fetch open orders and filter them
  const openOrders = await getOpenOrders({
    chainId: chain.id,
    userAddress: walletClient.account.address,
  })
  const filteredOpenOrders = openOrders.filter(
    ({ inputCurrency, outputCurrency }) =>
      (isAddressEqual(inputCurrency.address, token0) &&
        isAddressEqual(outputCurrency.address, token1)) ||
      (isAddressEqual(inputCurrency.address, token1) &&
        isAddressEqual(outputCurrency.address, token0)),
  )
  let orderIdsToClaim = filteredOpenOrders
    .filter(({ claimable }) => Number(claimable.value) > 0)
    .map((order) => order.id)
  let orderIdsToCancel = filteredOpenOrders
    .filter(({ cancelable }) => Number(cancelable.value) > 0)
    .map((order) => order.id)

  console.log(
    `Ready to start market making on ${market.base.symbol}/${market.quote.symbol}`,
  )

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const price = await fetchBinanceMarketPrice(process.env.BINANCE_MARKET_ID!)
    console.log('------------------------------------------------')
    console.log(`Current market price: ${price}`)

    // step 3: Place market making quotes
    await placeMarketMakingQuotes({
      chainId: chain.id,
      userAddress: walletClient.account.address,
      bidQuotes: [
        ...bidConfig.map(([priceFactor, amount]) => ({
          price: (price * priceFactor).toString(),
          amount: amount.toString(),
        })),
      ],
      askQuotes: [
        ...askConfig.map(([priceFactor, amount]) => ({
          price: (price * priceFactor).toString(),
          amount: amount.toString(),
        })),
      ],
      baseToken: market.base.address,
      quoteToken: market.quote.address,
      options: {
        rpcUrl,
        useSubgraph: false,
        orderIdsToClaim,
        orderIdsToCancel,
      },
    }).then(async (transaction) => {
      const hash = await walletClient.sendTransaction(transaction)
      const transactionReceipt = await publicClient.waitForTransactionReceipt({
        hash,
      })
      if (transactionReceipt.status === 'success') {
        const { bidOrderIds, askOrderIds } = parseMakeOrderIdsFromReceipt({
          market,
          transactionReceipt,
        })

        console.log(`Transaction successful: ${hash}`)
        console.log(
          `Placed ${bidOrderIds.length} bid orders and ${askOrderIds.length} ask orders`,
        )
        console.log(
          `Claimed ${orderIdsToClaim.length} orders and canceled ${orderIdsToCancel.length} orders`,
        )

        orderIdsToClaim = [...bidOrderIds, ...askOrderIds]
        orderIdsToCancel = [...bidOrderIds, ...askOrderIds]
      }
    })

    await new Promise((resolve) =>
      setTimeout(resolve, parseInt(process.env.POLL_INTERVAL || '5000')),
    )
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
