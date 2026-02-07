import { Address } from 'viem'

export const vaultKeys = {
  all: () => ['vault'] as const,

  price: (params: {
    chainId: number
    assetAddress?: Address
    oracleAddress?: Address
  }) => [...vaultKeys.all(), 'price', params] as const,

  vaultOracle: (params: {
    chainId: number
    vaultAddress?: Address
    oracleAddress?: Address
  }) => [...vaultKeys.all(), 'vaultOracle', params] as const,

  indexerPrices: (params: { chainId: number }) => [...vaultKeys.all(), 'indexerPrices', params] as const,

  vaultInfo: (params: { chainId: number; vaultAddress: Address }) =>
    [...vaultKeys.all(), 'vaultInfo', params] as const,

  earnVaultInfo: (params: { chainId: number; vaultAddress: Address }) =>
    [...vaultKeys.all(), 'earnVaultInfo', params] as const,

  indexerEarnVault: (params: { chainId: number; vaultAddress: Address }) =>
    [...vaultKeys.all(), 'indexerEarnVault', params] as const,
}
