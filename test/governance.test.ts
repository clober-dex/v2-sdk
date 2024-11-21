import { beforeEach, expect, test } from 'vitest'
import {
  ElectionRoundStatus,
  end,
  getKeepersElectionCurrentRoundData,
  getKeepersElectionGovernorMetadata,
  mintVCLOB,
  register,
  vote,
} from '@clober/v2-sdk'
import { parseEther } from 'viem'

import { cloberTestChain2 } from '../src/constants/test-chain'
import { CONTRACT_ADDRESSES } from '../src/constants/addresses'

import { FORK_URL } from './utils/constants'
import { createProxyClients2 } from './utils/utils'

const clients = createProxyClients2(
  Array.from({ length: 2 }, () => Math.floor(new Date().getTime())).map(
    (id) => id,
  ),
)

beforeEach(async () => {
  await Promise.all(
    clients.map(({ testClient }) => {
      return testClient.reset({
        jsonRpcUrl: FORK_URL,
        blockNumber: 98954710n,
      })
    }),
  )
})

test('Get election metadata', async () => {
  const { publicClient, walletClient, testClient } = clients[0] as any

  const devAddress =
    '0x5F79EE8f8fA862E98201120d83c4eC39D9468D49' as `0x${string}`
  const clobTokenAddress =
    '0x920D79Aeb75bBFd9467BC487DfA862FEB91D23c3' as `0x${string}`
  const startBlockTimestamp = 1732106810n

  await testClient.impersonateAccount({
    address: devAddress,
  })

  await testClient.setBalance({
    address: clobTokenAddress,
    value: parseEther('100'),
  })

  const metadata = await getKeepersElectionGovernorMetadata({
    chainId: cloberTestChain2.id,
    options: {
      rpcUrl: publicClient.transport.url!,
    },
  })

  const rounddata = await getKeepersElectionCurrentRoundData({
    chainId: cloberTestChain2.id,
    userAddress: devAddress,
    options: {
      rpcUrl: publicClient.transport.url!,
      useSubgraph: false,
    },
  })

  expect(metadata.minCandidateBalance).toBe(1000000000000000000000n)
  expect(metadata.quota).toBe(5)
  expect(rounddata.round).toBe(0)
  expect(rounddata.keepers).toEqual([devAddress])
  expect(rounddata.nextRoundStartTime).toBe(1735689600n)
  expect(rounddata.vclobAmount).toBe(0n)
  expect(rounddata.status).toBe(ElectionRoundStatus.NotStarted)
  expect(rounddata.quota).toBe(0)
  expect(rounddata.finalistsThreshold).toBe(0n)
  expect(rounddata.startTime).toBe(0n)
  expect(rounddata.votingEndTime).toBe(0n)
  expect(rounddata.registrationEndTime).toBe(0n)
  expect(rounddata.candidatesLength).toBe(0)
  expect(rounddata.finalistsLength).toBe(0)
  expect(rounddata.candidates).toEqual([])
  expect(rounddata.finalists).toEqual([])
})

test('Mint and election', async () => {
  const { publicClient, walletClient, testClient } = clients[0] as any

  const devAddress =
    '0x5F79EE8f8fA862E98201120d83c4eC39D9468D49' as `0x${string}`
  const clobTokenAddress =
    '0x920D79Aeb75bBFd9467BC487DfA862FEB91D23c3' as `0x${string}`
  const startBlockTimestamp = 1732106810n

  await testClient.impersonateAccount({
    address: devAddress,
  })

  await testClient.setBalance({
    address: clobTokenAddress,
    value: parseEther('10000'),
  })

  const approveMintHash = await walletClient.writeContract({
    account: devAddress,
    chain: cloberTestChain2,
    address: clobTokenAddress,
    abi: [
      {
        inputs: [
          {
            internalType: 'address',
            name: 'spender',
            type: 'address',
          },
          {
            internalType: 'uint256',
            name: 'value',
            type: 'uint256',
          },
        ],
        name: 'approve',
        outputs: [
          {
            internalType: 'bool',
            name: '',
            type: 'bool',
          },
        ],
        stateMutability: 'nonpayable',
        type: 'function',
      },
    ] as const,
    functionName: 'approve',
    args: [
      CONTRACT_ADDRESSES[cloberTestChain2.id]!.VoteLockedCloberToken,
      2n ** 256n - 1n,
    ],
  })
  const approveMintReceipt = await publicClient.waitForTransactionReceipt({
    hash: approveMintHash!,
  })
  expect(approveMintReceipt.status).toEqual('success')

  const mintTx = await mintVCLOB({
    chainId: cloberTestChain2.id,
    userAddress: '0x5F79EE8f8fA862E98201120d83c4eC39D9468D49',
    amount: 2000000000000000000000n,
    options: {
      rpcUrl: publicClient.transport.url!,
      useSubgraph: false,
    },
  })
  const mintHash = await walletClient.sendTransaction({
    ...mintTx!,
    account: '0x5F79EE8f8fA862E98201120d83c4eC39D9468D49',
    gasPrice: mintTx!.gasPrice! * 2n,
  })
  const mintReceipt = await publicClient.waitForTransactionReceipt({
    hash: mintHash,
  })
  expect(mintReceipt.status).toEqual('success')

  const metadata = await getKeepersElectionGovernorMetadata({
    chainId: cloberTestChain2.id,
    options: {
      rpcUrl: publicClient.transport.url!,
    },
  })
  let rounddata = await getKeepersElectionCurrentRoundData({
    chainId: cloberTestChain2.id,
    userAddress: devAddress,
    options: {
      rpcUrl: publicClient.transport.url!,
      useSubgraph: false,
    },
  })

  expect(metadata.minCandidateBalance).toBe(1000000000000000000000n)
  expect(metadata.quota).toBe(5)
  expect(rounddata.round).toBe(0)
  expect(rounddata.keepers).toEqual([devAddress])
  expect(rounddata.nextRoundStartTime).toBe(1735689600n)
  expect(rounddata.vclobAmount).toBe(0n)
  expect(rounddata.status).toBe(ElectionRoundStatus.NotStarted)
  expect(rounddata.quota).toBe(0)
  expect(rounddata.finalistsThreshold).toBe(0n)
  expect(rounddata.startTime).toBe(0n)
  expect(rounddata.votingEndTime).toBe(0n)
  expect(rounddata.registrationEndTime).toBe(0n)
  expect(rounddata.candidatesLength).toBe(0)
  expect(rounddata.finalistsLength).toBe(0)
  expect(rounddata.candidates).toEqual([])
  expect(rounddata.finalists).toEqual([])

  await testClient.increaseTime({
    seconds: Number(rounddata.nextRoundStartTime - startBlockTimestamp),
  })

  const voteTx = await vote({
    chainId: cloberTestChain2.id,
    userAddress: devAddress,
    candidateAddress: devAddress,
    inFavor: true,
    options: {
      rpcUrl: publicClient.transport.url!,
      useSubgraph: false,
    },
  })
  const voteHash = await walletClient.sendTransaction({
    ...voteTx!,
    account: devAddress,
    gasPrice: mintTx!.gasPrice! * 2n,
  })
  const voteReceipt = await publicClient.waitForTransactionReceipt({
    hash: voteHash,
  })
  expect(voteReceipt.status).toEqual('success')
  rounddata = await getKeepersElectionCurrentRoundData({
    chainId: cloberTestChain2.id,
    userAddress: devAddress,
    options: {
      rpcUrl: publicClient.transport.url!,
      useSubgraph: false,
    },
  })

  expect(rounddata.round).toBe(1)
  expect(rounddata.keepers).toEqual([])
  expect(rounddata.nextRoundStartTime).toBe(1751328000n)
  expect(rounddata.vclobAmount).toBe(2000000000000000000000n)
  expect(rounddata.status).toBe(ElectionRoundStatus.Voting)
  expect(rounddata.quota).toBe(5)
  expect(rounddata.finalistsThreshold).toBe(200000000000000000000n)
  expect(rounddata.startTime).toBe(1735689600n)
  expect(rounddata.votingEndTime).toBe(1735948800n)
  expect(rounddata.registrationEndTime).toBe(1736035200n)
  expect(rounddata.candidatesLength).toBe(1)
  expect(rounddata.finalistsLength).toBe(0)
  expect(rounddata.candidates).toEqual([
    {
      address: '0x5F79EE8f8fA862E98201120d83c4eC39D9468D49',
      vclobAmount: 2000000000000000000000n,
      hasVotedTo: true,
      forVotes: 2000000000000000000000n,
      againstVotes: 0n,
    },
  ])
  expect(rounddata.finalists).toEqual([])

  await testClient.increaseTime({
    seconds: Number(rounddata.votingEndTime - rounddata.startTime),
  })

  const registerTx = await register({
    chainId: cloberTestChain2.id,
    userAddress: devAddress,
    options: {
      rpcUrl: publicClient.transport.url!,
      useSubgraph: false,
    },
  })
  const registerHash = await walletClient.sendTransaction({
    ...registerTx!,
    account: devAddress,
    gasPrice: mintTx!.gasPrice! * 2n,
  })
  const registerReceipt = await publicClient.waitForTransactionReceipt({
    hash: registerHash,
  })
  expect(registerReceipt.status).toEqual('success')

  rounddata = await getKeepersElectionCurrentRoundData({
    chainId: cloberTestChain2.id,
    userAddress: devAddress,
    options: {
      rpcUrl: publicClient.transport.url!,
      useSubgraph: false,
    },
  })

  expect(rounddata.round).toBe(1)
  expect(rounddata.keepers).toEqual([])
  expect(rounddata.nextRoundStartTime).toBe(1751328000n)
  expect(rounddata.vclobAmount).toBe(2000000000000000000000n)
  expect(rounddata.status).toBe(ElectionRoundStatus.Registration)
  expect(rounddata.quota).toBe(5)
  expect(rounddata.finalistsThreshold).toBe(200000000000000000000n)
  expect(rounddata.startTime).toBe(1735689600n)
  expect(rounddata.votingEndTime).toBe(1735948800n)
  expect(rounddata.registrationEndTime).toBe(1736035200n)
  expect(rounddata.candidatesLength).toBe(1)
  expect(rounddata.finalistsLength).toBe(1)
  expect(rounddata.candidates).toEqual([
    {
      address: '0x5F79EE8f8fA862E98201120d83c4eC39D9468D49',
      vclobAmount: 2000000000000000000000n,
      hasVotedTo: true,
      forVotes: 2000000000000000000000n,
      againstVotes: 0n,
    },
  ])
  expect(rounddata.finalists).toEqual([
    {
      address: '0x5F79EE8f8fA862E98201120d83c4eC39D9468D49',
      vclobAmount: 2000000000000000000000n,
      hasVotedTo: true,
      forVotes: 2000000000000000000000n,
      againstVotes: 0n,
    },
  ])

  await testClient.increaseTime({
    seconds: Number(rounddata.registrationEndTime - rounddata.votingEndTime),
  })

  const endTx = await end({
    chainId: cloberTestChain2.id,
    userAddress: devAddress,
    options: {
      rpcUrl: publicClient.transport.url!,
      useSubgraph: false,
    },
  })
  const endHash = await walletClient.sendTransaction({
    ...endTx!,
    account: devAddress,
    gasPrice: mintTx!.gasPrice! * 2n,
  })
  const endReceipt = await publicClient.waitForTransactionReceipt({
    hash: endHash,
  })
  expect(endReceipt.status).toEqual('success')

  rounddata = await getKeepersElectionCurrentRoundData({
    chainId: cloberTestChain2.id,
    userAddress: devAddress,
    options: {
      rpcUrl: publicClient.transport.url!,
      useSubgraph: false,
    },
  })

  expect(rounddata.round).toBe(1)
  expect(rounddata.keepers).toEqual([devAddress])
  expect(rounddata.nextRoundStartTime).toBe(1751328000n)
  expect(rounddata.vclobAmount).toBe(2000000000000000000000n)
  expect(rounddata.status).toBe(ElectionRoundStatus.Ended)
  expect(rounddata.quota).toBe(5)
  expect(rounddata.finalistsThreshold).toBe(200000000000000000000n)
  expect(rounddata.startTime).toBe(1735689600n)
  expect(rounddata.votingEndTime).toBe(1735948800n)
  expect(rounddata.registrationEndTime).toBe(1736035200n)
  expect(rounddata.candidatesLength).toBe(1)
  expect(rounddata.finalistsLength).toBe(1)
  expect(rounddata.candidates).toEqual([
    {
      address: '0x5F79EE8f8fA862E98201120d83c4eC39D9468D49',
      vclobAmount: 2000000000000000000000n,
      hasVotedTo: true,
      forVotes: 2000000000000000000000n,
      againstVotes: 0n,
    },
  ])
  expect(rounddata.finalists).toEqual([
    {
      address: '0x5F79EE8f8fA862E98201120d83c4eC39D9468D49',
      vclobAmount: 2000000000000000000000n,
      hasVotedTo: true,
      forVotes: 2000000000000000000000n,
      againstVotes: 0n,
    },
  ])
})
