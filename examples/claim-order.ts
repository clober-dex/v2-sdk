import { createWalletClient, http } from 'viem'
import { arbitrumSepolia } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'
import * as dotenv from 'dotenv'
import {
  claimOrders,
  getMarket,
  getOpenOrders,
  setApprovalOfOpenOrdersForAll,
} from '@clober/v2-sdk'

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
  const approveHash = await setApprovalOfOpenOrdersForAll({
    chainId: chain.id,
    walletClient: walletClient!,
  })
  console.log(`approve hash: ${approveHash}`)

  const openOrders = await getOpenOrders({
    chainId: chain.id,
    userAddress: walletClient.account.address,
  })
  const { transaction, result } = await claimOrders({
    chainId: chain.id,
    userAddress: walletClient.account.address,
    ids: openOrders.map((order) => order.id),
  })
  const hash = await walletClient.sendTransaction({
    ...transaction,
  })
  console.log(`claim orders hash: ${hash}`)
  console.log(`result: `, result)

  const market = await getMarket({
    chainId: chain.id,
    token0: USDC,
    token1: ETH,
  })
  console.log(`market: `, market)

  const afterOpenOrders = await getOpenOrders({
    chainId: chain.id,
    userAddress: walletClient.account.address,
  })
  console.log(`openOrders: `, afterOpenOrders)
}

main()
