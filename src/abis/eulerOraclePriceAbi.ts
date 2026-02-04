import { Abi } from 'viem'

export const eulerOraclePriceAbi = [
  {
    name: 'getQuote',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'amount', type: 'uint256' },
      { name: 'base', type: 'address' },
      { name: 'quote', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const satisfies Abi
