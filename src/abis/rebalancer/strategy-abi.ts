export const STRATEGY_ABI = [
  {
    inputs: [
      {
        internalType: 'contract IOracle',
        name: 'referenceOracle_',
        type: 'address',
      },
      {
        internalType: 'contract IPoolStorage',
        name: 'poolStorage_',
        type: 'address',
      },
      {
        internalType: 'contract IBookManager',
        name: 'bookManager_',
        type: 'address',
      },
      {
        internalType: 'address',
        name: 'initialOwner',
        type: 'address',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    inputs: [],
    name: 'ExceedsThreshold',
    type: 'error',
  },
  {
    inputs: [],
    name: 'InvalidConfig',
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
    name: 'InvalidValue',
    type: 'error',
  },
  {
    inputs: [],
    name: 'NotOperator',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'owner',
        type: 'address',
      },
    ],
    name: 'OwnableInvalidOwner',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'account',
        type: 'address',
      },
    ],
    name: 'OwnableUnauthorizedAccount',
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
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'previousOwner',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'newOwner',
        type: 'address',
      },
    ],
    name: 'OwnershipTransferStarted',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'previousOwner',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'newOwner',
        type: 'address',
      },
    ],
    name: 'OwnershipTransferred',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'operator',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'bool',
        name: 'status',
        type: 'bool',
      },
    ],
    name: 'SetOperator',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'bytes32',
        name: 'key',
        type: 'bytes32',
      },
      {
        components: [
          {
            internalType: 'uint24',
            name: 'referenceThreshold',
            type: 'uint24',
          },
          {
            internalType: 'uint24',
            name: 'rateA',
            type: 'uint24',
          },
          {
            internalType: 'uint24',
            name: 'rateB',
            type: 'uint24',
          },
          {
            internalType: 'uint24',
            name: 'minRateA',
            type: 'uint24',
          },
          {
            internalType: 'uint24',
            name: 'minRateB',
            type: 'uint24',
          },
          {
            internalType: 'uint24',
            name: 'priceThresholdA',
            type: 'uint24',
          },
          {
            internalType: 'uint24',
            name: 'priceThresholdB',
            type: 'uint24',
          },
        ],
        indexed: false,
        internalType: 'struct ISimpleOracleStrategy.Config',
        name: 'config',
        type: 'tuple',
      },
    ],
    name: 'UpdateConfig',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'bytes32',
        name: 'key',
        type: 'bytes32',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'oraclePrice',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'Tick',
        name: 'tickA',
        type: 'int24',
      },
      {
        indexed: false,
        internalType: 'Tick',
        name: 'tickB',
        type: 'int24',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'alpha',
        type: 'uint256',
      },
    ],
    name: 'UpdatePrice',
    type: 'event',
  },
  {
    inputs: [],
    name: 'RATE_PRECISION',
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
    inputs: [],
    name: 'acceptOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
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
    ],
    name: 'computeOrders',
    outputs: [
      {
        components: [
          {
            internalType: 'Tick',
            name: 'tick',
            type: 'int24',
          },
          {
            internalType: 'uint64',
            name: 'rawAmount',
            type: 'uint64',
          },
        ],
        internalType: 'struct IStrategy.Order[]',
        name: 'ordersA',
        type: 'tuple[]',
      },
      {
        components: [
          {
            internalType: 'Tick',
            name: 'tick',
            type: 'int24',
          },
          {
            internalType: 'uint64',
            name: 'rawAmount',
            type: 'uint64',
          },
        ],
        internalType: 'struct IStrategy.Order[]',
        name: 'ordersB',
        type: 'tuple[]',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getAlpha',
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
        internalType: 'bytes32',
        name: 'key',
        type: 'bytes32',
      },
    ],
    name: 'getConfig',
    outputs: [
      {
        components: [
          {
            internalType: 'uint24',
            name: 'referenceThreshold',
            type: 'uint24',
          },
          {
            internalType: 'uint24',
            name: 'rateA',
            type: 'uint24',
          },
          {
            internalType: 'uint24',
            name: 'rateB',
            type: 'uint24',
          },
          {
            internalType: 'uint24',
            name: 'minRateA',
            type: 'uint24',
          },
          {
            internalType: 'uint24',
            name: 'minRateB',
            type: 'uint24',
          },
          {
            internalType: 'uint24',
            name: 'priceThresholdA',
            type: 'uint24',
          },
          {
            internalType: 'uint24',
            name: 'priceThresholdB',
            type: 'uint24',
          },
        ],
        internalType: 'struct ISimpleOracleStrategy.Config',
        name: '',
        type: 'tuple',
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
    ],
    name: 'getPrice',
    outputs: [
      {
        components: [
          {
            internalType: 'uint208',
            name: 'oraclePrice',
            type: 'uint208',
          },
          {
            internalType: 'Tick',
            name: 'tickA',
            type: 'int24',
          },
          {
            internalType: 'Tick',
            name: 'tickB',
            type: 'int24',
          },
        ],
        internalType: 'struct ISimpleOracleStrategy.Price',
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    name: 'isOperator',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
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
    ],
    name: 'isOraclePriceValid',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'owner',
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
    inputs: [],
    name: 'pendingOwner',
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
    inputs: [],
    name: 'poolStorage',
    outputs: [
      {
        internalType: 'contract IPoolStorage',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'referenceOracle',
    outputs: [
      {
        internalType: 'contract IOracle',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'renounceOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
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
        components: [
          {
            internalType: 'uint24',
            name: 'referenceThreshold',
            type: 'uint24',
          },
          {
            internalType: 'uint24',
            name: 'rateA',
            type: 'uint24',
          },
          {
            internalType: 'uint24',
            name: 'rateB',
            type: 'uint24',
          },
          {
            internalType: 'uint24',
            name: 'minRateA',
            type: 'uint24',
          },
          {
            internalType: 'uint24',
            name: 'minRateB',
            type: 'uint24',
          },
          {
            internalType: 'uint24',
            name: 'priceThresholdA',
            type: 'uint24',
          },
          {
            internalType: 'uint24',
            name: 'priceThresholdB',
            type: 'uint24',
          },
        ],
        internalType: 'struct ISimpleOracleStrategy.Config',
        name: 'config',
        type: 'tuple',
      },
    ],
    name: 'setConfig',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'operator',
        type: 'address',
      },
      {
        internalType: 'bool',
        name: 'status',
        type: 'bool',
      },
    ],
    name: 'setOperator',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'newOwner',
        type: 'address',
      },
    ],
    name: 'transferOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
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
        name: 'oraclePrice',
        type: 'uint256',
      },
      {
        internalType: 'Tick',
        name: 'tickA',
        type: 'int24',
      },
      {
        internalType: 'Tick',
        name: 'tickB',
        type: 'int24',
      },
      {
        internalType: 'uint256',
        name: 'alpha',
        type: 'uint256',
      },
    ],
    name: 'updatePrice',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const
