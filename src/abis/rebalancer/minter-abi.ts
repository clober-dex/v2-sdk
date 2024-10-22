export const MINTER_ABI = [
  {
    inputs: [
      {
        internalType: 'address',
        name: '_bookManager',
        type: 'address',
      },
      {
        internalType: 'address payable',
        name: '_rebalancer',
        type: 'address',
      },
      {
        internalType: 'address',
        name: '_router',
        type: 'address',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'target',
        type: 'address',
      },
    ],
    name: 'AddressEmptyCode',
    type: 'error',
  },
  {
    inputs: [],
    name: 'ERC20TransferFailed',
    type: 'error',
  },
  {
    inputs: [],
    name: 'FailedCall',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'balance',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'needed',
        type: 'uint256',
      },
    ],
    name: 'InsufficientBalance',
    type: 'error',
  },
  {
    inputs: [],
    name: 'NativeTransferFailed',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'bytes',
        name: 'message',
        type: 'bytes',
      },
    ],
    name: 'RouterSwapFailed',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'token',
        type: 'address',
      },
    ],
    name: 'SafeERC20FailedOperation',
    type: 'error',
  },
  {
    inputs: [],
    name: 'bookManager',
    outputs: [
      {
        internalType: 'contract IBookManager',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: 'key',
        type: 'bytes32',
      },
      {
        internalType: 'uint256',
        name: 'amountA',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'amountB',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'minLpAmount',
        type: 'uint256',
      },
      {
        components: [
          {
            internalType: 'uint256',
            name: 'permitAmount',
            type: 'uint256',
          },
          {
            components: [
              {
                internalType: 'uint256',
                name: 'deadline',
                type: 'uint256',
              },
              {
                internalType: 'uint8',
                name: 'v',
                type: 'uint8',
              },
              {
                internalType: 'bytes32',
                name: 'r',
                type: 'bytes32',
              },
              {
                internalType: 'bytes32',
                name: 's',
                type: 'bytes32',
              },
            ],
            internalType: 'struct PermitSignature',
            name: 'signature',
            type: 'tuple',
          },
        ],
        internalType: 'struct ERC20PermitParams',
        name: 'currencyAPermitParams',
        type: 'tuple',
      },
      {
        components: [
          {
            internalType: 'uint256',
            name: 'permitAmount',
            type: 'uint256',
          },
          {
            components: [
              {
                internalType: 'uint256',
                name: 'deadline',
                type: 'uint256',
              },
              {
                internalType: 'uint8',
                name: 'v',
                type: 'uint8',
              },
              {
                internalType: 'bytes32',
                name: 'r',
                type: 'bytes32',
              },
              {
                internalType: 'bytes32',
                name: 's',
                type: 'bytes32',
              },
            ],
            internalType: 'struct PermitSignature',
            name: 'signature',
            type: 'tuple',
          },
        ],
        internalType: 'struct ERC20PermitParams',
        name: 'currencyBPermitParams',
        type: 'tuple',
      },
      {
        components: [
          {
            internalType: 'Currency',
            name: 'inCurrency',
            type: 'address',
          },
          {
            internalType: 'uint256',
            name: 'amount',
            type: 'uint256',
          },
          {
            internalType: 'bytes',
            name: 'data',
            type: 'bytes',
          },
        ],
        internalType: 'struct IMinter.SwapParams',
        name: 'swapParams',
        type: 'tuple',
      },
    ],
    name: 'mint',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'rebalancer',
    outputs: [
      {
        internalType: 'contract Rebalancer',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'router',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    stateMutability: 'payable',
    type: 'receive',
  },
] as const
