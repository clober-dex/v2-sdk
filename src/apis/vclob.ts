import { PublicClient } from 'viem'

import { CHAIN_IDS } from '../constants/chain'
import { Subgraph } from '../constants/subgraph'
import { VCLOB as VCLOBModel } from '../model/vclob'
import { CONTRACT_ADDRESSES } from '../constants/addresses'
import { VCLOB_ABI } from '../abis/governance/vclob-abi'
import { VCLOB } from '../type'

const fetchVCLOBListFromSubgraph = async (
  chainId: CHAIN_IDS,
  userAddress: `0x${string}`,
) => {
  const result = await Subgraph.get<{
    data: {
      vclobs: VCLOBModel[]
    }
  }>(
    chainId,
    'getVCLOBList',
    'query getVCLOBList($owner: String!) { vclobs( where: { owner: $owner } ) { id owner amount lockedTimepoint } }',
    {
      owner: userAddress,
    },
  )
  return result.data.vclobs
}

export const fetchVCLOBList = async (
  publicClient: PublicClient,
  chainId: CHAIN_IDS,
  userAddress: `0x${string}`,
  useSubgraph: boolean,
): Promise<VCLOB[]> => {
  if (!useSubgraph) {
    return []
  }
  const [depositDuration, withdrawDuration] = await publicClient.multicall({
    contracts: [
      {
        address: CONTRACT_ADDRESSES[chainId]!.VoteLockedCloberToken,
        abi: VCLOB_ABI,
        functionName: 'depositDuration',
      },
      {
        address: CONTRACT_ADDRESSES[chainId]!.VoteLockedCloberToken,
        abi: VCLOB_ABI,
        functionName: 'withdrawDuration',
      },
    ],
    allowFailure: false,
  })
  const currentTimepoint = BigInt(Math.floor(Date.now() / 1000))
  const vclobs = await fetchVCLOBListFromSubgraph(chainId, userAddress)
  return vclobs.map((vclob) => {
    const phaseDuration = depositDuration + withdrawDuration
    const phase = (currentTimepoint - vclob.lockedTimepoint) / phaseDuration
    const withdrawalStartTimepoint =
      vclob.lockedTimepoint + phase * phaseDuration + depositDuration
    const withdrawalEndTimepoint = withdrawalStartTimepoint + withdrawDuration
    return {
      ...vclob,
      withdrawalStartTimepoint,
      withdrawalEndTimepoint,
    }
  })
}
