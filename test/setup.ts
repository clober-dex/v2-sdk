import { startProxy } from '@viem/anvil'
import * as dotenv from 'dotenv'
import {
  createPublicClient,
  createTestClient,
  createWalletClient,
  getAddress,
  http,
  zeroHash,
} from 'viem'
import { mnemonicToAccount } from 'viem/accounts'
import {
  getContractAddresses,
  getPool,
  Market,
  openPool,
  Pool,
  setApprovalOfOpenOrdersForAll,
} from '@clober/v2-sdk'

import {
  FORK_URL,
  ANVIL_PORT,
  cloberTestChain,
  DEV_MNEMONIC_SEED,
  DEV_WALLET,
  erc20Abi,
  FORK_BLOCK_NUMBER,
  MOCK_USDC,
} from './utils/constants'
import { waitForTransaction } from './utils/transaction'
import { maxApproveToken } from './utils/currency'

dotenv.config()

let snapshotId: `0x${string}` | null = null
let tokenAddress: `0x${string}` | null = null
const market: Market | null = null
let pool: Pool | null = null

const CHAIN = cloberTestChain

export default async function () {
  const start = performance.now()
  console.log(`Setting up test environment...`)
  await startProxy({
    options: {
      chainId: CHAIN.id,
      forkUrl:
        process.env.ARBITRUM_SEPOLIA_RPC_URL ||
        'https://arbitrum-sepolia-archive.allthatnode.com',
      forkBlockNumber: FORK_BLOCK_NUMBER,
      mnemonic: DEV_MNEMONIC_SEED,
      accounts: 10,
      balance: 1000, // 1000 ETH
      autoImpersonate: true,
      gasPrice: 0,
    },
    port: ANVIL_PORT,
  })
  console.log(
    `[${(performance.now() - start).toFixed(
      2,
    )}ms]Anvil proxy started on port ${ANVIL_PORT}`,
  )
}

export async function setUp(alias: string) {
  alias = `0x${Buffer.from(alias, 'utf8').toString('hex')}`
  const account = mnemonicToAccount(DEV_MNEMONIC_SEED)
  const publicClient = createPublicClient({
    chain: CHAIN,
    transport: http(`http://127.0.0.1:${ANVIL_PORT}/${Number(alias)}`),
  })

  const testClient = createTestClient({
    chain: CHAIN,
    mode: 'anvil',
    transport: http(`http://127.0.0.1:${ANVIL_PORT}/${Number(alias)}`),
  })

  const walletClient = createWalletClient({
    chain: CHAIN,
    account,
    transport: http(`http://127.0.0.1:${ANVIL_PORT}/${Number(alias)}`),
  })

  let start = performance.now()
  if (
    snapshotId !== null &&
    tokenAddress !== null &&
    market !== null &&
    pool !== null
  ) {
    await testClient.revert({ id: snapshotId })
    snapshotId = await testClient.snapshot()
    console.log(
      `[${(performance.now() - start).toFixed(
        2,
      )}ms] Test client reverted to snapshot ID: ${snapshotId}`,
    )
    return {
      testClient,
      publicClient,
      walletClient,
      account,
      snapshotId,
      tokenAddress,
      market,
      pool,
    }
  }

  // 0. Reset the test client to a specific block
  await testClient.reset({
    jsonRpcUrl: FORK_URL,
    blockNumber: FORK_BLOCK_NUMBER,
  })
  console.log(
    `[${(performance.now() - start).toFixed(
      2,
    )}ms] Test client reset to block ${FORK_BLOCK_NUMBER}`,
  )

  // 1. Deploy ERC20 token
  start = performance.now()
  const tokenDeployHash = await walletClient.deployContract({
    account,
    chain: CHAIN,
    abi: erc20Abi,
    bytecode:
      '0x6060604052341561000f57600080fd5b604051610dd1380380610dd18339810160405280805190602001909190805182019190602001805190602001909190805182019190505083600160003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020819055508360008190555082600390805190602001906100a79291906100e3565b5081600460006101000a81548160ff021916908360ff16021790555080600590805190602001906100d99291906100e3565b5050505050610188565b828054600181600116156101000203166002900490600052602060002090601f016020900481019282601f1061012457805160ff1916838001178555610152565b82800160010185558215610152579182015b82811115610151578251825591602001919060010190610136565b5b50905061015f9190610163565b5090565b61018591905b80821115610181576000816000905550600101610169565b5090565b90565b610c3a806101976000396000f3006060604052600436106100af576000357c0100000000000000000000000000000000000000000000000000000000900463ffffffff16806306fdde03146100b4578063095ea7b31461014257806318160ddd1461019c57806323b872dd146101c557806327e235e31461023e578063313ce5671461028b5780635c658165146102ba57806370a082311461032657806395d89b4114610373578063a9059cbb14610401578063dd62ed3e1461045b575b600080fd5b34156100bf57600080fd5b6100c76104c7565b6040518080602001828103825283818151815260200191508051906020019080838360005b838110156101075780820151818401526020810190506100ec565b50505050905090810190601f1680156101345780820380516001836020036101000a031916815260200191505b509250505060405180910390f35b341561014d57600080fd5b610182600480803573ffffffffffffffffffffffffffffffffffffffff16906020019091908035906020019091905050610565565b604051808215151515815260200191505060405180910390f35b34156101a757600080fd5b6101af610657565b6040518082815260200191505060405180910390f35b34156101d057600080fd5b610224600480803573ffffffffffffffffffffffffffffffffffffffff1690602001909190803573ffffffffffffffffffffffffffffffffffffffff1690602001909190803590602001909190505061065d565b604051808215151515815260200191505060405180910390f35b341561024957600080fd5b610275600480803573ffffffffffffffffffffffffffffffffffffffff169060200190919050506108f7565b6040518082815260200191505060405180910390f35b341561029657600080fd5b61029e61090f565b604051808260ff1660ff16815260200191505060405180910390f35b34156102c557600080fd5b610310600480803573ffffffffffffffffffffffffffffffffffffffff1690602001909190803573ffffffffffffffffffffffffffffffffffffffff16906020019091905050610922565b6040518082815260200191505060405180910390f35b341561033157600080fd5b61035d600480803573ffffffffffffffffffffffffffffffffffffffff16906020019091905050610947565b6040518082815260200191505060405180910390f35b341561037e57600080fd5b610386610990565b6040518080602001828103825283818151815260200191508051906020019080838360005b838110156103c65780820151818401526020810190506103ab565b50505050905090810190601f1680156103f35780820380516001836020036101000a031916815260200191505b509250505060405180910390f35b341561040c57600080fd5b610441600480803573ffffffffffffffffffffffffffffffffffffffff16906020019091908035906020019091905050610a2e565b604051808215151515815260200191505060405180910390f35b341561046657600080fd5b6104b1600480803573ffffffffffffffffffffffffffffffffffffffff1690602001909190803573ffffffffffffffffffffffffffffffffffffffff16906020019091905050610b87565b6040518082815260200191505060405180910390f35b60038054600181600116156101000203166002900480601f01602080910402602001604051908101604052809291908181526020018280546001816001161561010002031660029004801561055d5780601f106105325761010080835404028352916020019161055d565b820191906000526020600020905b81548152906001019060200180831161054057829003601f168201915b505050505081565b600081600260003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020819055508273ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff167f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925846040518082815260200191505060405180910390a36001905092915050565b60005481565b600080600260008673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002054905082600160008773ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020541015801561072e5750828110155b151561073957600080fd5b82600160008673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000206000828254019250508190555082600160008773ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020600082825403925050819055507fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff8110156108865782600260008773ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020600082825403925050819055505b8373ffffffffffffffffffffffffffffffffffffffff168573ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef856040518082815260200191505060405180910390a360019150509392505050565b60016020528060005260406000206000915090505481565b600460009054906101000a900460ff1681565b6002602052816000526040600020602052806000526040600020600091509150505481565b6000600160008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020549050919050565b60058054600181600116156101000203166002900480601f016020809104026020016040519081016040528092919081815260200182805460018160011615610100020316600290048015610a265780601f106109fb57610100808354040283529160200191610a26565b820191906000526020600020905b815481529060010190602001808311610a0957829003601f168201915b505050505081565b600081600160003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000205410151515610a7e57600080fd5b81600160003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000206000828254039250508190555081600160008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020600082825401925050819055508273ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef846040518082815260200191505060405180910390a36001905092915050565b6000600260008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020549050929150505600a165627a7a72305820df254047bc8f2904ad3e966b6db116d703bebd40efadadb5e738c836ffc8f58a0029',
    args: [100000000n * 10n ** 18n, 'TestToken', 18, 'TT'],
  })
  const tokenDeployReceipt = await publicClient.waitForTransactionReceipt({
    hash: tokenDeployHash,
  })
  tokenAddress = getAddress(tokenDeployReceipt.contractAddress!)
  console.log(
    `[${(performance.now() - start).toFixed(
      2,
    )}ms] ERC20 token deployed at address: ${tokenAddress}`,
  )

  // 2. Open a pool with the deployed ERC20 token
  start = performance.now()
  await openPool({
    chainId: publicClient.chain!.id,
    userAddress: DEV_WALLET,
    tokenA: MOCK_USDC,
    tokenB: tokenAddress,
    salt: zeroHash,
    options: {
      rpcUrl: publicClient.transport.url!,
      useSubgraph: false,
    },
  }).then((transaction) =>
    waitForTransaction({
      transaction: transaction!,
      publicClient,
      walletClient,
    }),
  )
  console.log(`[${(performance.now() - start).toFixed(2)}ms] Pool opened`)

  // 3. Approve the ERC20 token and set approval for open orders
  start = performance.now()
  await maxApproveToken({
    token: tokenAddress,
    spender: getContractAddresses({ chainId: CHAIN.id }).Controller,
    walletClient,
  }).then(async (hash) => {
    await publicClient.waitForTransactionReceipt({ hash: hash! })
    console.log(
      `[${(performance.now() - start).toFixed(
        2,
      )}ms] ERC20 token approved for Controller hash: ${hash}`,
    )
  })

  start = performance.now()
  await maxApproveToken({
    token: MOCK_USDC,
    spender: getContractAddresses({ chainId: CHAIN.id }).Controller,
    walletClient,
  }).then(async (hash) => {
    await publicClient.waitForTransactionReceipt({ hash: hash! })
    console.log(
      `[${(performance.now() - start).toFixed(
        2,
      )}ms] Mock token approved for Controller hash: ${hash}`,
    )
  })

  start = performance.now()
  await maxApproveToken({
    token: tokenAddress,
    spender: getContractAddresses({ chainId: CHAIN.id }).Minter,
    walletClient,
  }).then(async (hash) => {
    await publicClient.waitForTransactionReceipt({ hash: hash! })
    console.log(
      `[${(performance.now() - start).toFixed(
        2,
      )}ms] ERC20 token approved for Minter hash: ${hash}`,
    )
  })

  start = performance.now()
  await maxApproveToken({
    token: MOCK_USDC,
    spender: getContractAddresses({ chainId: CHAIN.id }).Minter,
    walletClient,
  }).then(async (hash) => {
    await publicClient.waitForTransactionReceipt({ hash: hash! })
    console.log(
      `[${(performance.now() - start).toFixed(
        2,
      )}ms] Mock token approved for Minter hash: ${hash}`,
    )
  })

  // 4. Set approval for all open orders
  start = performance.now()
  const erc721ApproveHash = await setApprovalOfOpenOrdersForAll({
    chainId: CHAIN.id,
    walletClient,
    options: {
      rpcUrl: publicClient.transport.url!,
    },
  })
  await publicClient.waitForTransactionReceipt({
    hash: erc721ApproveHash!,
  })
  console.log(
    `[${(performance.now() - start).toFixed(
      2,
    )}ms] ERC721 approval for all open orders hash: ${erc721ApproveHash}`,
  )

  snapshotId = await testClient.snapshot()
  console.log(`Test client snapshot created with ID: ${snapshotId}`)

  pool = await getPool({
    chainId: publicClient.chain.id,
    token0: MOCK_USDC,
    token1: tokenAddress,
    salt: zeroHash,
    options: {
      rpcUrl: publicClient.transport.url!,
      useSubgraph: false,
    },
  })

  return {
    testClient,
    publicClient,
    walletClient,
    account,
    snapshotId,
    tokenAddress,
    market: pool.market,
    pool,
  }
}
