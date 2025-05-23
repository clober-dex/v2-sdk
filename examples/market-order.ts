import { createWalletClient, http, parseUnits } from 'viem'
import { arbitrumSepolia } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'
import * as dotenv from 'dotenv'
import { getMarket, marketOrder } from '@clober/v2-sdk'

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
    result: { spent, taken },
  } = await marketOrder({
    chainId: chain.id,
    userAddress: walletClient.account.address,
    inputToken: USDC,
    outputToken: ETH,
    amountIn: '1.12',
  })
  const hash = await walletClient.sendTransaction({
    ...transaction,
    gasPrice: parseUnits('1', 9),
  })
  console.log(`market order hash: ${hash}`)
  console.log(`spent: `, spent)
  console.log(`taken: `, taken)

  const market = await getMarket({
    chainId: chain.id,
    token0: USDC,
    token1: ETH,
  })
  console.log(`market: `, market)
}

main()
