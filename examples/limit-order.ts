import { createWalletClient, http, parseUnits } from 'viem'
import { arbitrumSepolia } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'
import * as dotenv from 'dotenv'
import { getMarket, getOpenOrders, limitOrder } from '@clober/v2-sdk'

dotenv.config()

const main = async () => {
  const chain = arbitrumSepolia
  const ETH = '0x0000000000000000000000000000000000000000'
  const USDC = '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0'
  const walletClient = createWalletClient({
    chain,
    account: privateKeyToAccount(
      (process.env.TESTNET_PRIVATE_KEY || '0x') as `0x${string}`,
    ),
    transport: http(),
  })

  const {
    transaction,
    result: { make, taken, spent },
  } = await limitOrder({
    chainId: chain.id,
    userAddress: walletClient.account.address,
    inputToken: USDC,
    outputToken: ETH,
    amount: '1.12',
    price: '8000.01',
  })
  const hash = await walletClient.sendTransaction({
    ...transaction,
    gasPrice: parseUnits('1', 9),
  })
  console.log(`limit order hash: ${hash}`)
  console.log(`make: `, make)
  console.log(`taken: `, taken)
  console.log(`spent: `, spent)

  const market = await getMarket({
    chainId: chain.id,
    token0: USDC,
    token1: ETH,
  })
  console.log(`market: `, market)

  const openOrders = await getOpenOrders({
    chainId: chain.id,
    userAddress: walletClient.account.address,
  })
  console.log(`open orders: `, openOrders)
}

main()
