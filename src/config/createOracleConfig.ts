import type { OracleConfig } from './types'

export function createOracleConfig(config: OracleConfig): OracleConfig {
  if (typeof config.chainId !== 'number') {
    throw new Error('createOracleConfig: chainId is required and must be a number')
  }

  if (!config.routerAddress) {
    throw new Error('createOracleConfig: routerAddress is required')
  }

  if (!config.usdUnitOfAccount) {
    throw new Error('createOracleConfig: usdUnitOfAccount is required')
  }

  if (!config.usdReferenceToken) {
    throw new Error('createOracleConfig: usdReferenceToken is required')
  }

  if (config.indexerUrl !== undefined) {
    try {
      new URL(config.indexerUrl)
    } catch {
      throw new Error('createOracleConfig: indexerUrl must be a valid URL')
    }
  }

  if (config.indexerStaleTime !== undefined && config.indexerStaleTime < 0) {
    throw new Error('createOracleConfig: indexerStaleTime must be >= 0')
  }

  if (config.onIndexerError !== undefined && typeof config.onIndexerError !== 'function') {
    throw new Error('createOracleConfig: onIndexerError must be a function')
  }

  return {
    chainId: config.chainId,
    routerAddress: config.routerAddress,
    usdUnitOfAccount: config.usdUnitOfAccount,
    usdReferenceToken: config.usdReferenceToken,
    indexerUrl: config.indexerUrl,
    indexerStaleTime: config.indexerStaleTime,
    onIndexerError: config.onIndexerError,
    vaultLensAddress: config.vaultLensAddress,
  }
}
