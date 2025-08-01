export const BOOK_MANAGER_ABI = [
  {
    inputs: [
      {
        internalType: 'OrderId',
        name: 'id',
        type: 'uint256',
      },
    ],
    name: 'getOrder',
    outputs: [
      {
        components: [
          {
            internalType: 'address',
            name: 'provider',
            type: 'address',
          },
          {
            internalType: 'uint64',
            name: 'open',
            type: 'uint64',
          },
          {
            internalType: 'uint64',
            name: 'claimable',
            type: 'uint64',
          },
        ],
        internalType: 'struct IBookManager.OrderInfo',
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
        internalType: 'uint256',
        name: 'tokenId',
        type: 'uint256',
      },
    ],
    name: 'ownerOf',
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
        internalType: 'BookId',
        name: 'id',
        type: 'uint192',
      },
    ],
    name: 'getBookKey',
    outputs: [
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
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    type: 'event',
    name: 'Make',
    inputs: [
      {
        name: 'bookId',
        type: 'uint192',
        indexed: true,
        internalType: 'BookId',
      },
      { name: 'user', type: 'address', indexed: true, internalType: 'address' },
      { name: 'tick', type: 'int24', indexed: false, internalType: 'Tick' },
      {
        name: 'orderIndex',
        type: 'uint256',
        indexed: false,
        internalType: 'uint256',
      },
      { name: 'unit', type: 'uint64', indexed: false, internalType: 'uint64' },
      {
        name: 'provider',
        type: 'address',
        indexed: false,
        internalType: 'address',
      },
    ],
    anonymous: false,
  },
] as const
