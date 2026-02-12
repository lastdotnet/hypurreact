import type { VaultConfig } from './types'

/**
 * Creates and validates a VaultConfig object.
 *
 * This function validates required fields and provides helpful warnings
 * in production when optional but recommended fields are missing.
 *
 * @param config - The vault configuration object
 * @returns Validated VaultConfig
 * @throws Error if required fields are missing or invalid
 *
 * @example
 * ```tsx
 * import { createVaultConfig } from '@hypurr/vaults'
 *
 * const config = createVaultConfig({
 *   chainId: 999,
 *   usdUnitOfAccount: '0x0000000000000000000000000000000000000348',
 *   usdReferenceToken: '0xb8ce59fc3717ada4c02eadf9682a9e934f625ebb',
 *   indexerUrl: 'https://indexer-hyperevm-api-prod.up.railway.app',
 *   vaultLensAddress: '0x0eaDDE9EfCf1540dcA8f94e813E12db55f8405a8',
 * })
 * ```
 */
export function createVaultConfig(config: VaultConfig): VaultConfig {
  // Required field validation
  if (typeof config.chainId !== 'number') {
    throw new Error('createVaultConfig: chainId is required and must be a number')
  }

  if (!config.usdUnitOfAccount) {
    throw new Error('createVaultConfig: usdUnitOfAccount is required')
  }

  if (!config.usdReferenceToken) {
    throw new Error('createVaultConfig: usdReferenceToken is required')
  }

  // Optional field validation
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

  // Production warnings for missing optional but recommended fields
  if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'production') {
    if (!config.indexerUrl) {
      console.warn(
        '[@hypurr/vaults] No indexerUrl configured. All data will be fetched on-chain via VaultLens, ' +
        'which is slower and more expensive. Configure indexerUrl for better performance.'
      )
    }

    if (!config.vaultLensAddress) {
      console.warn(
        '[@hypurr/vaults] No vaultLensAddress configured. On-chain fallback will not be available ' +
        'if the indexer fails, and on-chain-only categories (irmConfig, feeConfig, etc.) cannot be fetched.'
      )
    }

    if (!config.indexerUrl && !config.vaultLensAddress) {
      console.error(
        '[@hypurr/vaults] Neither indexerUrl nor vaultLensAddress configured. ' +
        'No data source available - hooks will return empty data.'
      )
    }
  }

  // Validate retry config
  if (config.retry !== undefined) {
    if (config.retry.count !== undefined && config.retry.count !== false) {
      if (typeof config.retry.count !== 'number' || config.retry.count < 0) {
        throw new Error('createVaultConfig: retry.count must be a non-negative number or false')
      }
    }
    if (config.retry.delay !== undefined) {
      if (typeof config.retry.delay !== 'number' && typeof config.retry.delay !== 'function') {
        throw new Error('createVaultConfig: retry.delay must be a number or function')
      }
    }
    if (config.retry.shouldRetry !== undefined && typeof config.retry.shouldRetry !== 'function') {
      throw new Error('createVaultConfig: retry.shouldRetry must be a function')
    }
  }

  return {
    chainId: config.chainId,
    usdUnitOfAccount: config.usdUnitOfAccount,
    usdReferenceToken: config.usdReferenceToken,
    indexerUrl: config.indexerUrl,
    indexerStaleTime: config.indexerStaleTime,
    onIndexerError: config.onIndexerError,
    vaultLensAddress: config.vaultLensAddress,
    governedPerspectiveAddress: config.governedPerspectiveAddress,
    eulerEarnGovernedPerspectiveAddress: config.eulerEarnGovernedPerspectiveAddress,
    retry: config.retry,
  }
}
