import { createWalletClient, http } from 'viem'
import { arbitrumSepolia } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'
import * as dotenv from 'dotenv'
import { getMarket, openMarket } from '@clober/v2-sdk'

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

  const openBidBookTx = await openMarket({
    chainId: chain.id,
    inputToken: USDC,
    outputToken: ETH,
    userAddress: walletClient.account.address,
  })
  const openBidBookTxHash = await walletClient.sendTransaction({
    ...openBidBookTx,
  })
  console.log(`open bid book hash: ${openBidBookTxHash}`)

  const openAskBookTx = await openMarket({
    chainId: chain.id,
    inputToken: ETH,
    outputToken: USDC,
    userAddress: walletClient.account.address,
  })
  const openAskBookTxHash = await walletClient.sendTransaction({
    ...openAskBookTx,
  })
  console.log(`open market hash: ${openAskBookTxHash}`)

  const market = await getMarket({
    chainId: chain.id,
    token0: ETH,
    token1: USDC,
  })
  console.log(`market: `, market)
}

main()
