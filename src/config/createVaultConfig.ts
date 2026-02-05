import type { VaultConfig } from './types'

export function createVaultConfig(config: VaultConfig): VaultConfig {
  if (typeof config.chainId !== 'number') {
    throw new Error('createVaultConfig: chainId is required and must be a number')
  }

  if (!config.usdUnitOfAccount) {
    throw new Error('createVaultConfig: usdUnitOfAccount is required')
  }

  if (!config.usdReferenceToken) {
    throw new Error('createVaultConfig: usdReferenceToken is required')
  }

  if (config.indexerUrl !== undefined) {
    try {
      new URL(config.indexerUrl)
    } catch {
      throw new Error('createVaultConfig: indexerUrl must be a valid URL')
    }
  }

  if (config.indexerStaleTime !== undefined && config.indexerStaleTime < 0) {
    throw new Error('createVaultConfig: indexerStaleTime must be >= 0')
  }

  if (config.onIndexerError !== undefined && typeof config.onIndexerError !== 'function') {
    throw new Error('createVaultConfig: onIndexerError must be a function')
  }

  return {
    chainId: config.chainId,
    usdUnitOfAccount: config.usdUnitOfAccount,
    usdReferenceToken: config.usdReferenceToken,
    indexerUrl: config.indexerUrl,
    indexerStaleTime: config.indexerStaleTime,
    onIndexerError: config.onIndexerError,
    vaultLensAddress: config.vaultLensAddress,
  }
}
