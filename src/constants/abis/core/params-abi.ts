export const MAKE_ORDER_PARAMS_ABI = [
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
      { name: 'provider', internalType: 'address', type: 'address' },
      {
        internalType: 'bytes',
        name: 'hookData',
        type: 'bytes',
      },
    ],
    internalType: 'struct IController.MakeOrderParams',
    name: 'params',
    type: 'tuple',
  },
]

export const CLAIM_ORDER_PARAMS_ABI = [
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
    internalType: 'struct IController.ClaimOrderParams',
    name: 'params',
    type: 'tuple',
  },
]

export const CANCEL_ORDER_PARAMS_ABI = [
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
    internalType: 'struct IController.CancelOrderParams',
    name: 'params',
    type: 'tuple',
  },
]
