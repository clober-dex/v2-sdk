export const STRATEGY_ABI = [
  {
    inputs: [
      {
        internalType: 'contract IOracle',
        name: 'referenceOracle_',
        type: 'address',
      },
      {
        internalType: 'contract IRebalancer',
        name: 'rebalancer_',
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
    name: 'InvalidAccess',
    type: 'error',
  },
  {
    inputs: [],
    name: 'InvalidConfig',
    type: 'error',
  },
  {
    inputs: [],
    name: 'InvalidOraclePrice',
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
    inputs: [],
    name: 'Paused',
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
        internalType: 'bytes32',
        name: 'key',
        type: 'bytes32',
      },
    ],
    name: 'Pause',
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
    ],
    name: 'Unpause',
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
            name: 'rebalanceThreshold',
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
        name: 'rate',
        type: 'uint256',
      },
    ],
    name: 'UpdatePosition',
    type: 'event',
  },
  {
    inputs: [],
    name: 'LAST_RAW_AMOUNT_MASK',
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
        internalType: 'address',
        name: '',
        type: 'address',
      },
      {
        internalType: 'bytes32',
        name: 'key',
        type: 'bytes32',
      },
      {
        internalType: 'uint256',
        name: 'burnAmount',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'lastTotalSupply',
        type: 'uint256',
      },
    ],
    name: 'burnHook',
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
            name: 'rebalanceThreshold',
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
    name: 'getLastRawAmount',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
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
    name: 'getPosition',
    outputs: [
      {
        components: [
          {
            internalType: 'bool',
            name: 'paused',
            type: 'bool',
          },
          {
            internalType: 'uint128',
            name: 'oraclePrice',
            type: 'uint128',
          },
          {
            internalType: 'uint24',
            name: 'rate',
            type: 'uint24',
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
        internalType: 'struct ISimpleOracleStrategy.Position',
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
    inputs: [
      {
        internalType: 'bytes32',
        name: 'key',
        type: 'bytes32',
      },
    ],
    name: 'isPaused',
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
        internalType: 'address',
        name: '',
        type: 'address',
      },
      {
        internalType: 'bytes32',
        name: '',
        type: 'bytes32',
      },
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    name: 'mintHook',
    outputs: [],
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
    inputs: [
      {
        internalType: 'bytes32',
        name: 'key',
        type: 'bytes32',
      },
    ],
    name: 'pause',
    outputs: [],
    stateMutability: 'nonpayable',
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
    inputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
      {
        internalType: 'bytes32',
        name: 'key',
        type: 'bytes32',
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
        name: 'liquidityA',
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
        name: 'liquidityB',
        type: 'tuple[]',
      },
    ],
    name: 'rebalanceHook',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'rebalancer',
    outputs: [
      {
        internalType: 'contract IRebalancer',
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
            name: 'rebalanceThreshold',
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
    ],
    name: 'unpause',
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
        internalType: 'uint24',
        name: 'rate',
        type: 'uint24',
      },
    ],
    name: 'updatePosition',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const
