import { Abi } from 'viem'

export const eVaultImplementationAbi = [
  {
    name: 'oracle',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
  },
  {
    name: 'unitOfAccount',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
  },
  {
    name: 'asset',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
  },
] as const satisfies Abi
