import * as dotenv from 'dotenv'
import { createWalletClient, http, parseUnits, zeroHash } from 'viem'
import { arbitrumSepolia } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'

import { openPool } from '../../src'

dotenv.config()

const main = async () => {
  const walletClient = createWalletClient({
    chain: arbitrumSepolia,
    account: privateKeyToAccount(
      (process.env.TESTNET_PRIVATE_KEY || '0x') as `0x${string}`,
    ),
    transport: http(),
  })

  const transaction = await openPool({
    chainId: arbitrumSepolia.id,
    userAddress: '0x5F79EE8f8fA862E98201120d83c4eC39D9468D49',
    tokenA: '0x00BFD44e79FB7f6dd5887A9426c8EF85A0CD23e0',
    tokenB: '0xF2e615A933825De4B39b497f6e6991418Fb31b78',
    salt: zeroHash,
  })
  const hash = await walletClient.sendTransaction({
    ...transaction,
    gasPrice: parseUnits('1', 9),
  })
  console.log(`open pool hash: ${hash}`)
}

main()
