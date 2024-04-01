export const FEE_POLICY_WRAPPER_ABI = [
  {
    inputs: [],
    name: 'InvalidFeePolicy',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'FeePolicy',
        name: 'self',
        type: 'uint24',
      },
      {
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
      {
        internalType: 'bool',
        name: 'reverseRounding',
        type: 'bool',
      },
    ],
    name: 'calculateFee',
    outputs: [
      {
        internalType: 'int256',
        name: 'fee',
        type: 'int256',
      },
    ],
    stateMutability: 'pure',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'FeePolicy',
        name: 'self',
        type: 'uint24',
      },
      {
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
      {
        internalType: 'bool',
        name: 'reverseFee',
        type: 'bool',
      },
    ],
    name: 'calculateOriginalAmount',
    outputs: [
      {
        internalType: 'uint256',
        name: 'originalAmount',
        type: 'uint256',
      },
    ],
    stateMutability: 'pure',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'bool',
        name: 'usesQuote_',
        type: 'bool',
      },
      {
        internalType: 'int24',
        name: 'rate_',
        type: 'int24',
      },
    ],
    name: 'encode',
    outputs: [
      {
        internalType: 'FeePolicy',
        name: 'feePolicy',
        type: 'uint24',
      },
    ],
    stateMutability: 'pure',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'FeePolicy',
        name: 'self',
        type: 'uint24',
      },
    ],
    name: 'usesQuote',
    outputs: [
      {
        internalType: 'bool',
        name: 'f',
        type: 'bool',
      },
    ],
    stateMutability: 'pure',
    type: 'function',
  },
] as const
