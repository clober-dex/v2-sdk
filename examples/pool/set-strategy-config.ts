import * as dotenv from 'dotenv'
import {
  createPublicClient,
  createWalletClient,
  http,
  parseUnits,
  zeroHash,
} from 'viem'
import { arbitrumSepolia } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'

import { setStrategyConfig } from '../../src'

dotenv.config()

const main = async () => {
  const walletClient = createWalletClient({
    chain: arbitrumSepolia,
    account: privateKeyToAccount(
      (process.env.OWNER_PRIVATE_KEY || '0x') as `0x${string}`,
    ),
    transport: http(),
  })
  const publicClient = createPublicClient({
    chain: arbitrumSepolia,
    transport: http(),
  })

  const transaction = await setStrategyConfig({
    chainId: arbitrumSepolia.id,
    userAddress: walletClient.account.address,
    token0: '0x00bfd44e79fb7f6dd5887a9426c8ef85a0cd23e0',
    token1: '0xF2e615A933825De4B39b497f6e6991418Fb31b78',
    salt: zeroHash,
    config: {
      referenceThreshold: '0.1',
      rebalanceThreshold: '0.1',
      rateA: '0.1',
      rateB: '0.1',
      minRateA: '0.003',
      minRateB: '0.003',
      priceThresholdA: '0.1',
      priceThresholdB: '0.1',
    },
  })

  const hash = await walletClient.sendTransaction({
    ...transaction,
    gasPrice: parseUnits('1', 9),
  })
  await publicClient.waitForTransactionReceipt({ hash: hash })
  console.log(`set config hash: ${hash}`)
}

main()
