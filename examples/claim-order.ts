import { createWalletClient, http, parseUnits } from 'viem'
import { arbitrumSepolia } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'
import * as dotenv from 'dotenv'
import {
  getMarket,
  claimOrders,
  getOpenOrders,
  setApprovalOfOpenOrdersForAll,
} from '@clober/v2-sdk'

dotenv.config()

const main = async () => {
  const walletClient = createWalletClient({
    chain: arbitrumSepolia,
    account: privateKeyToAccount(
      (process.env.DEV_PRIVATE_KEY || '0x') as `0x${string}`,
    ),
    transport: http(),
  })
  const approveHash = await setApprovalOfOpenOrdersForAll({
    chainId: arbitrumSepolia.id,
    walletClient,
  })
  console.log(`approve hash: ${approveHash}`)

  const openOrders = await getOpenOrders({
    chainId: arbitrumSepolia.id,
    userAddress: walletClient.account.address,
  })
  const { transaction, result } = await claimOrders({
    chainId: arbitrumSepolia.id,
    userAddress: walletClient.account.address,
    ids: openOrders.map((order) => order.id),
  })
  const hash = await walletClient.sendTransaction({
    ...transaction,
    gasPrice: parseUnits('1', 9),
  })
  console.log(`claim orders hash: ${hash}`)
  console.log(`result: `, result)

  const market = await getMarket({
    chainId: arbitrumSepolia.id,
    token0: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    token1: '0x0000000000000000000000000000000000000000',
  })
  console.log(`market: `, market)

  const afterOpenOrders = await getOpenOrders({
    chainId: arbitrumSepolia.id,
    userAddress: walletClient.account.address,
  })
  console.log(`openOrders: `, afterOpenOrders)
}

main()
