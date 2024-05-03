export const CONTROLLER_ABI = [
  {
    inputs: [
      {
        internalType: 'address',
        name: 'bookManager',
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
    name: 'ControllerSlippage',
    type: 'error',
  },
  {
    inputs: [],
    name: 'Deadline',
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
    name: 'InvalidAccess',
    type: 'error',
  },
  {
    inputs: [],
    name: 'InvalidAction',
    type: 'error',
  },
  {
    inputs: [],
    name: 'InvalidLength',
    type: 'error',
  },
  {
    inputs: [],
    name: 'InvalidPrice',
    type: 'error',
  },
  {
    inputs: [],
    name: 'InvalidTick',
    type: 'error',
  },
  {
    inputs: [],
    name: 'NativeTransferFailed',
    type: 'error',
  },
  {
    inputs: [],
    name: 'ReentrancyGuardReentrantCall',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'uint8',
        name: 'bits',
        type: 'uint8',
      },
      {
        internalType: 'uint256',
        name: 'value',
        type: 'uint256',
      },
    ],
    name: 'SafeCastOverflowedUintDowncast',
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
    inputs: [
      {
        components: [
          {
            internalType: 'OrderId',
            name: 'id',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'leftQuoteAmount',
            type: 'uint256',
          },
          {
            internalType: 'bytes',
            name: 'hookData',
            type: 'bytes',
          },
        ],
        internalType: 'struct IController.CancelOrderParams[]',
        name: 'orderParamsList',
        type: 'tuple[]',
      },
      {
        internalType: 'address[]',
        name: 'tokensToSettle',
        type: 'address[]',
      },
      {
        components: [
          {
            internalType: 'uint256',
            name: 'tokenId',
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
            internalType: 'struct IController.PermitSignature',
            name: 'signature',
            type: 'tuple',
          },
        ],
        internalType: 'struct IController.ERC721PermitParams[]',
        name: 'permitParamsList',
        type: 'tuple[]',
      },
      {
        internalType: 'uint64',
        name: 'deadline',
        type: 'uint64',
      },
    ],
    name: 'cancel',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: 'OrderId',
            name: 'id',
            type: 'uint256',
          },
          {
            internalType: 'bytes',
            name: 'hookData',
            type: 'bytes',
          },
        ],
        internalType: 'struct IController.ClaimOrderParams[]',
        name: 'orderParamsList',
        type: 'tuple[]',
      },
      {
        internalType: 'address[]',
        name: 'tokensToSettle',
        type: 'address[]',
      },
      {
        components: [
          {
            internalType: 'uint256',
            name: 'tokenId',
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
            internalType: 'struct IController.PermitSignature',
            name: 'signature',
            type: 'tuple',
          },
        ],
        internalType: 'struct IController.ERC721PermitParams[]',
        name: 'permitParamsList',
        type: 'tuple[]',
      },
      {
        internalType: 'uint64',
        name: 'deadline',
        type: 'uint64',
      },
    ],
    name: 'claim',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'enum IController.Action[]',
        name: 'actionList',
        type: 'uint8[]',
      },
      {
        internalType: 'bytes[]',
        name: 'paramsDataList',
        type: 'bytes[]',
      },
      {
        internalType: 'address[]',
        name: 'tokensToSettle',
        type: 'address[]',
      },
      {
        components: [
          {
            internalType: 'address',
            name: 'token',
            type: 'address',
          },
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
            internalType: 'struct IController.PermitSignature',
            name: 'signature',
            type: 'tuple',
          },
        ],
        internalType: 'struct IController.ERC20PermitParams[]',
        name: 'erc20PermitParamsList',
        type: 'tuple[]',
      },
      {
        components: [
          {
            internalType: 'uint256',
            name: 'tokenId',
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
            internalType: 'struct IController.PermitSignature',
            name: 'signature',
            type: 'tuple',
          },
        ],
        internalType: 'struct IController.ERC721PermitParams[]',
        name: 'erc721PermitParamsList',
        type: 'tuple[]',
      },
      {
        internalType: 'uint64',
        name: 'deadline',
        type: 'uint64',
      },
    ],
    name: 'execute',
    outputs: [
      {
        internalType: 'OrderId[]',
        name: 'ids',
        type: 'uint256[]',
      },
    ],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'price',
        type: 'uint256',
      },
    ],
    name: 'fromPrice',
    outputs: [
      {
        internalType: 'Tick',
        name: '',
        type: 'int24',
      },
    ],
    stateMutability: 'pure',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'BookId',
        name: 'id',
        type: 'uint192',
      },
      {
        internalType: 'Tick',
        name: 'tick',
        type: 'int24',
      },
    ],
    name: 'getDepth',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'BookId',
        name: 'id',
        type: 'uint192',
      },
    ],
    name: 'getHighestPrice',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'OrderId',
        name: 'orderId',
        type: 'uint256',
      },
    ],
    name: 'getOrder',
    outputs: [
      {
        internalType: 'address',
        name: 'provider',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'price',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'openAmount',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'claimableAmount',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: 'BookId',
            name: 'takeBookId',
            type: 'uint192',
          },
          {
            internalType: 'BookId',
            name: 'makeBookId',
            type: 'uint192',
          },
          {
            internalType: 'uint256',
            name: 'limitPrice',
            type: 'uint256',
          },
          {
            internalType: 'Tick',
            name: 'tick',
            type: 'int24',
          },
          {
            internalType: 'uint256',
            name: 'quoteAmount',
            type: 'uint256',
          },
          {
            internalType: 'bytes',
            name: 'takeHookData',
            type: 'bytes',
          },
          {
            internalType: 'bytes',
            name: 'makeHookData',
            type: 'bytes',
          },
        ],
        internalType: 'struct IController.LimitOrderParams[]',
        name: 'orderParamsList',
        type: 'tuple[]',
      },
      {
        internalType: 'address[]',
        name: 'tokensToSettle',
        type: 'address[]',
      },
      {
        components: [
          {
            internalType: 'address',
            name: 'token',
            type: 'address',
          },
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
            internalType: 'struct IController.PermitSignature',
            name: 'signature',
            type: 'tuple',
          },
        ],
        internalType: 'struct IController.ERC20PermitParams[]',
        name: 'permitParamsList',
        type: 'tuple[]',
      },
      {
        internalType: 'uint64',
        name: 'deadline',
        type: 'uint64',
      },
    ],
    name: 'limit',
    outputs: [
      {
        internalType: 'OrderId[]',
        name: 'ids',
        type: 'uint256[]',
      },
    ],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'sender',
        type: 'address',
      },
      {
        internalType: 'bytes',
        name: 'data',
        type: 'bytes',
      },
    ],
    name: 'lockAcquired',
    outputs: [
      {
        internalType: 'bytes',
        name: 'returnData',
        type: 'bytes',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: 'BookId',
            name: 'id',
            type: 'uint192',
          },
          {
            internalType: 'Tick',
            name: 'tick',
            type: 'int24',
          },
          {
            internalType: 'uint256',
            name: 'quoteAmount',
            type: 'uint256',
          },
          {
            internalType: 'bytes',
            name: 'hookData',
            type: 'bytes',
          },
        ],
        internalType: 'struct IController.MakeOrderParams[]',
        name: 'orderParamsList',
        type: 'tuple[]',
      },
      {
        internalType: 'address[]',
        name: 'tokensToSettle',
        type: 'address[]',
      },
      {
        components: [
          {
            internalType: 'address',
            name: 'token',
            type: 'address',
          },
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
            internalType: 'struct IController.PermitSignature',
            name: 'signature',
            type: 'tuple',
          },
        ],
        internalType: 'struct IController.ERC20PermitParams[]',
        name: 'permitParamsList',
        type: 'tuple[]',
      },
      {
        internalType: 'uint64',
        name: 'deadline',
        type: 'uint64',
      },
    ],
    name: 'make',
    outputs: [
      {
        internalType: 'OrderId[]',
        name: 'ids',
        type: 'uint256[]',
      },
    ],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      {
        components: [
          {
            components: [
              {
                internalType: 'Currency',
                name: 'base',
                type: 'address',
              },
              {
                internalType: 'uint64',
                name: 'unitSize',
                type: 'uint64',
              },
              {
                internalType: 'Currency',
                name: 'quote',
                type: 'address',
              },
              {
                internalType: 'FeePolicy',
                name: 'makerPolicy',
                type: 'uint24',
              },
              {
                internalType: 'contract IHooks',
                name: 'hooks',
                type: 'address',
              },
              {
                internalType: 'FeePolicy',
                name: 'takerPolicy',
                type: 'uint24',
              },
            ],
            internalType: 'struct IBookManager.BookKey',
            name: 'key',
            type: 'tuple',
          },
          {
            internalType: 'bytes',
            name: 'hookData',
            type: 'bytes',
          },
        ],
        internalType: 'struct IController.OpenBookParams[]',
        name: 'openBookParamsList',
        type: 'tuple[]',
      },
      {
        internalType: 'uint64',
        name: 'deadline',
        type: 'uint64',
      },
    ],
    name: 'open',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: 'BookId',
            name: 'id',
            type: 'uint192',
          },
          {
            internalType: 'uint256',
            name: 'limitPrice',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'baseAmount',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'minQuoteAmount',
            type: 'uint256',
          },
          {
            internalType: 'bytes',
            name: 'hookData',
            type: 'bytes',
          },
        ],
        internalType: 'struct IController.SpendOrderParams[]',
        name: 'orderParamsList',
        type: 'tuple[]',
      },
      {
        internalType: 'address[]',
        name: 'tokensToSettle',
        type: 'address[]',
      },
      {
        components: [
          {
            internalType: 'address',
            name: 'token',
            type: 'address',
          },
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
            internalType: 'struct IController.PermitSignature',
            name: 'signature',
            type: 'tuple',
          },
        ],
        internalType: 'struct IController.ERC20PermitParams[]',
        name: 'permitParamsList',
        type: 'tuple[]',
      },
      {
        internalType: 'uint64',
        name: 'deadline',
        type: 'uint64',
      },
    ],
    name: 'spend',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: 'BookId',
            name: 'id',
            type: 'uint192',
          },
          {
            internalType: 'uint256',
            name: 'limitPrice',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'quoteAmount',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'maxBaseAmount',
            type: 'uint256',
          },
          {
            internalType: 'bytes',
            name: 'hookData',
            type: 'bytes',
          },
        ],
        internalType: 'struct IController.TakeOrderParams[]',
        name: 'orderParamsList',
        type: 'tuple[]',
      },
      {
        internalType: 'address[]',
        name: 'tokensToSettle',
        type: 'address[]',
      },
      {
        components: [
          {
            internalType: 'address',
            name: 'token',
            type: 'address',
          },
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
            internalType: 'struct IController.PermitSignature',
            name: 'signature',
            type: 'tuple',
          },
        ],
        internalType: 'struct IController.ERC20PermitParams[]',
        name: 'permitParamsList',
        type: 'tuple[]',
      },
      {
        internalType: 'uint64',
        name: 'deadline',
        type: 'uint64',
      },
    ],
    name: 'take',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'Tick',
        name: 'tick',
        type: 'int24',
      },
    ],
    name: 'toPrice',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'pure',
    type: 'function',
  },
  {
    stateMutability: 'payable',
    type: 'receive',
  },
] as const
