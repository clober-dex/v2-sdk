import { createWalletClient, http, parseUnits } from 'viem'
import { arbitrumSepolia } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'
import * as dotenv from 'dotenv'
import { getMarket, marketOrder, signERC20Permit } from '@clober/v2-sdk'

dotenv.config()

const main = async () => {
  const walletClient = createWalletClient({
    chain: arbitrumSepolia,
    account: privateKeyToAccount(
      (process.env.DEV_PRIVATE_KEY || '0x') as `0x${string}`,
    ),
    transport: http(),
  })

  const erc20PermitParam = await signERC20Permit({
    chainId: arbitrumSepolia.id,
    walletClient,
    token: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    amount: '1.12',
  })

  const {
    transaction,
    result: { spend, take },
  } = await marketOrder({
    chainId: arbitrumSepolia.id,
    userAddress: walletClient.account.address,
    inputToken: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    outputToken: '0x0000000000000000000000000000000000000000',
    amountIn: '1.12',
    options: {
      erc20PermitParam: erc20PermitParam!,
    },
  })
  const hash = await walletClient.sendTransaction({
    ...transaction,
    gasPrice: parseUnits('1', 9),
  })
  console.log(`market order hash: ${hash}`)
  console.log(`spend: `, spend)
  console.log(`take: `, take)

  const market = await getMarket({
    chainId: arbitrumSepolia.id,
    token0: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    token1: '0x0000000000000000000000000000000000000000',
  })
  console.log(`market: `, market)
}

main()
