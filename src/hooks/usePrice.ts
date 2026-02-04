'use client'

import { Address } from 'viem'
import { useReadContracts } from 'wagmi'
import { eVaultImplementationAbi } from '../abis'
import type { OracleConfig } from '../config'
import { useOracleConfig } from '../context'
import { useVaultOraclePrice } from './useVaultOraclePrice'

/**
 * Parameters for the usePrice hook.
 */
export interface UsePriceParams {
  /** The asset address to get price for */
  assetAddress?: Address
  /** The vault address to fetch oracle/unitOfAccount from (if not explicitly provided) */
  vaultAddress?: Address
  /** The vault's oracle address (optional - if not provided and vaultAddress is given, will be fetched) */
  oracleAddress?: Address
  /** The vault's unit of account address (optional - if not provided and vaultAddress is given, will be fetched) */
  unitOfAccount?: Address
  /** Chain ID (optional, uses context if not provided) */
  chainId?: number
  /** Whether the query is enabled */
  enabled?: boolean
  /** Price from indexer API (used as primary, onchain as fallback) */
  indexerPrice?: number | null
  /** Optional config override (uses context if not provided) */
  config?: OracleConfig
}

/**
 * Result returned by the usePrice hook.
 */
export interface UsePriceResult {
  /** Asset price in USD */
  priceUSD: number
  /** Whether the price is loading */
  isLoading: boolean
  /** Whether there was an error fetching the price */
  isError: boolean
  /** Error object if query failed */
  error: Error | null
  /** Source of the price: 'vaultOracle' if from onchain, 'indexer' if from indexerPrice, 'none' if unavailable */
  source: 'vaultOracle' | 'indexer' | 'none'
}

/**
 * Unified hook to get asset price in USD using vault-specific oracles.
 *
 * This hook provides a convenient way to fetch asset prices by automatically handling
 * the retrieval of oracle and unit of account addresses from a vault if not explicitly provided.
 *
 * **Price Resolution Behavior:**
 * - If `oracleAddress` + `unitOfAccount` are provided: uses them directly
 * - If `vaultAddress` is provided but oracle/unitOfAccount are missing: fetches them from vault first
 * - If `indexerPrice` is provided and valid: returns it immediately (primary source)
 * - Falls back to on-chain oracle query when indexer price is unavailable
 *
 * @example
 * ```tsx
 * // Pattern 1: Using vaultAddress (auto-fetches oracle/unitOfAccount)
 * import { usePrice } from '@hypurr/oracle-react'
 *
 * function VaultAssetPrice({ vaultAddress, assetAddress }) {
 *   const { priceUSD, isLoading, isError, error, source } = usePrice({
 *     assetAddress,
 *     vaultAddress,
 *     // Oracle and unitOfAccount will be auto-fetched from the vault
 *   })
 *
 *   if (isLoading) return <span>Loading...</span>
 *   if (isError) return <span>Error: {error?.message}</span>
 *
 *   return (
 *     <div>
 *       <span>${priceUSD.toFixed(2)}</span>
 *       <small>Source: {source}</small>
 *     </div>
 *   )
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Pattern 2: Explicit oracle/unitOfAccount (skips vault config fetch)
 * import { usePrice } from '@hypurr/oracle-react'
 *
 * function DirectOraclePrice({ assetAddress, oracleAddress, unitOfAccount }) {
 *   const { priceUSD, isLoading, source } = usePrice({
 *     assetAddress,
 *     oracleAddress,
 *     unitOfAccount,
 *     // With indexer price as primary source
 *     indexerPrice: indexerData?.price,
 *   })
 *
 *   return (
 *     <div>
 *       <span>${priceUSD.toFixed(2)}</span>
 *       <small>({source})</small>
 *     </div>
 *   )
 * }
 * ```
 *
 * @param params - The parameters for the price query
 * @param params.assetAddress - The asset address to get price for
 * @param params.vaultAddress - The vault address to fetch oracle/unitOfAccount from (if not explicitly provided)
 * @param params.oracleAddress - The vault's oracle address (optional)
 * @param params.unitOfAccount - The vault's unit of account address (optional)
 * @param params.chainId - Chain ID (optional, uses context if not provided)
 * @param params.enabled - Whether the query is enabled (default: true)
 * @param params.indexerPrice - Price from indexer API (used as primary source)
 * @param params.config - Optional config override (uses context if not provided)
 * @returns The price result with USD value, loading state, error state, and source indicator
 */
export function usePrice({
  assetAddress,
  vaultAddress,
  oracleAddress,
  unitOfAccount,
  chainId,
  enabled = true,
  indexerPrice,
  config: configOverride,
}: UsePriceParams): UsePriceResult {
  // Get config from context or use override
  const contextConfig = useOracleConfig()
  const config = configOverride ?? contextConfig

  const effectiveChainId = chainId ?? config.chainId

  // Fetch oracle and unitOfAccount from vault if vaultAddress provided but oracle/unitOfAccount not provided
  const shouldFetchVaultConfig = enabled && !!vaultAddress && (!oracleAddress || !unitOfAccount)

  const {
    data: vaultConfigData,
    isLoading: isVaultConfigLoading,
    isError: isVaultConfigError,
    error: vaultConfigError,
  } = useReadContracts({
    contracts: [
      {
        address: vaultAddress,
        abi: eVaultImplementationAbi,
        functionName: 'oracle',
        chainId: effectiveChainId,
      },
      {
        address: vaultAddress,
        abi: eVaultImplementationAbi,
        functionName: 'unitOfAccount',
        chainId: effectiveChainId,
      },
    ],
    query: {
      enabled: shouldFetchVaultConfig,
      staleTime: 60_000, // Cache for 1 minute
    },
  })

  // Use fetched values if available, otherwise use provided values
  const finalOracleAddress = oracleAddress || (vaultConfigData?.[0]?.result as Address | undefined)
  const finalUnitOfAccount = unitOfAccount || (vaultConfigData?.[1]?.result as Address | undefined)

  // Use vault oracle for pricing
  const vaultOraclePrice = useVaultOraclePrice({
    assetAddress,
    oracleAddress: finalOracleAddress,
    unitOfAccount: finalUnitOfAccount,
    chainId: effectiveChainId,
    enabled: enabled && !!finalOracleAddress && !!finalUnitOfAccount,
    indexerPrice,
    config,
  })

  // Include vault config loading in overall loading state
  const isLoading = isVaultConfigLoading || vaultOraclePrice.isLoading

  // Aggregate error states
  const isError = isVaultConfigError || vaultOraclePrice.isError
  const error = vaultConfigError ?? vaultOraclePrice.error ?? null

  // Determine the price source
  // vaultOraclePrice.source can be 'indexer' | 'onchain' | 'none'
  // We map 'onchain' to 'vaultOracle' for the unified API
  let source: 'vaultOracle' | 'indexer' | 'none'
  if (vaultOraclePrice.source === 'indexer') {
    source = 'indexer'
  } else if (vaultOraclePrice.source === 'onchain') {
    source = 'vaultOracle'
  } else {
    source = 'none'
  }

  return {
    priceUSD: vaultOraclePrice.priceUSD,
    isLoading,
    isError,
    error,
    source,
  }
}
