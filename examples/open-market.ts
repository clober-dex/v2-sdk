import { createWalletClient, http, parseUnits } from 'viem'
import { arbitrumSepolia } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'
import * as dotenv from 'dotenv'
import { getMarket, openMarket } from '@clober/v2-sdk'

dotenv.config()

const main = async () => {
  const walletClient = createWalletClient({
    chain: arbitrumSepolia,
    account: privateKeyToAccount(
      (process.env.TESTNET_PRIVATE_KEY || '0x') as `0x${string}`,
    ),
    transport: http(),
  })

  const transaction1 = await openMarket({
    chainId: arbitrumSepolia.id,
    inputToken: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    outputToken: '0xF2e615A933825De4B39b497f6e6991418Fb31b78',
  })
  const hash1 = await walletClient.sendTransaction({
    ...transaction1,
    gasPrice: parseUnits('1', 9),
  })
  console.log(`open market hash: ${hash1}`)

  const transaction2 = await openMarket({
    chainId: arbitrumSepolia.id,
    inputToken: '0xF2e615A933825De4B39b497f6e6991418Fb31b78',
    outputToken: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
  })
  const hash2 = await walletClient.sendTransaction({
    ...transaction2,
    gasPrice: parseUnits('1', 9),
  })
  console.log(`open market hash: ${hash2}`)

  const market = await getMarket({
    chainId: arbitrumSepolia.id,
    token0: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    token1: '0xF2e615A933825De4B39b497f6e6991418Fb31b78',
  })
  console.log(`market: `, market)
}

main()
