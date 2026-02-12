'use client'

import { type Address, getAddress } from 'viem'
import { useReadContracts } from 'wagmi'
import { eVaultImplementationAbi } from '../abis'
import type { VaultConfig } from '../config'
import { useVaultConfig } from '../context'
import { useIndexerPrices } from './useIndexerPrices'
import { useVaultOraclePrice } from './useVaultOraclePrice'
import type { ProductId, ProductsConfig } from '../types/products'
import { isVaultInProduct } from '../types/products'

export interface UsePriceParams {
  assetAddress?: Address
  vaultAddress?: Address
  oracleAddress?: Address
  unitOfAccount?: Address
  chainId?: number
  enabled?: boolean
  config?: VaultConfig
  /**
   * When true, skip indexer and fetch price directly from on-chain oracle.
   * @default false
   */
  forceOnchain?: boolean
  /**
   * Optional product filter. When provided with products config,
   * the hook will return no price if the vault doesn't belong to the specified product.
   */
  product?: ProductId
  /**
   * Products configuration. Required when using the product filter.
   */
  products?: ProductsConfig
}

export interface UsePriceResult {
  priceUSD: number
  isLoading: boolean
  isError: boolean
  error: Error | null
  source: 'vaultOracle' | 'indexer' | 'none'
}

/**
 * Fetches the USD price for a vault's underlying asset.
 *
 * Uses a lazy-loading strategy for optimal performance:
 * 1. First checks indexer for cached price (fast, no RPC calls)
 * 2. If indexer has no price or price is stale (>15 min), fetches vault config
 * 3. Queries on-chain oracle for authoritative price
 *
 * @param params - Hook parameters
 * @param params.vaultAddress - The vault address (used to lookup indexer price and fetch oracle config)
 * @param params.assetAddress - Optional asset address (fetched from vault if not provided)
 * @param params.oracleAddress - Optional oracle address (fetched from vault if not provided)
 * @param params.unitOfAccount - Optional unit of account (fetched from vault if not provided)
 * @param params.chainId - Optional chain ID (uses config chainId if not provided)
 * @param params.enabled - Whether to enable the query (default: true)
 * @param params.config - Optional config override
 * @param params.forceOnchain - Skip indexer and fetch directly from oracle (default: false)
 * @param params.product - Optional product filter
 * @param params.products - Products configuration for filtering
 *
 * @returns Price data with source information
 *
 * @example
 * ```tsx
 * import { usePrice } from '@hypurr/vaults'
 *
 * function PriceDisplay({ vaultAddress }: { vaultAddress: Address }) {
 *   const { priceUSD, isLoading, source } = usePrice({ vaultAddress })
 *
 *   if (isLoading) return <span>Loading...</span>
 *
 *   return (
 *     <span>
 *       ${priceUSD.toFixed(2)}
 *       <small>({source})</small>
 *     </span>
 *   )
 * }
 * ```
 *
 * @example Force on-chain price
 * ```tsx
 * const { priceUSD } = usePrice({
 *   vaultAddress: '0x...',
 *   forceOnchain: true, // Always query oracle, skip indexer
 * })
 * ```
 */
export function usePrice({
  assetAddress,
  vaultAddress,
  oracleAddress,
  unitOfAccount,
  chainId,
  enabled = true,
  config: configOverride,
  forceOnchain = false,
  product,
  products,
}: UsePriceParams): UsePriceResult {
  const contextConfig = useVaultConfig()
  const config = configOverride ?? contextConfig

  const effectiveChainId = chainId ?? config.chainId

  // Check if vault belongs to the specified product (if filtering is enabled)
  const passesProductFilter =
    !product || !products || !vaultAddress || isVaultInProduct(products, vaultAddress, product)

  const indexerPrices = useIndexerPrices()

  // When forceOnchain is true, ignore indexer data
  let indexerPrice: number | null = null
  if (!forceOnchain && vaultAddress && indexerPrices.data) {
    try {
      const normalizedVaultAddress = getAddress(vaultAddress) as Address
      indexerPrice = indexerPrices.data[normalizedVaultAddress] ?? null
    } catch {
      indexerPrice = null
    }
  }

  const hasIndexerPrice = indexerPrice !== null && indexerPrice > 0
  const indexerResolved = forceOnchain || !indexerPrices.isLoading

  // Only fetch vault config (oracle/unitOfAccount/asset) when:
  // 1. Enabled and have vault address
  // 2. Oracle, unitOfAccount, or asset not already provided
  // 3. forceOnchain OR (indexer has resolved AND doesn't have the price)
  // 4. Passes product filter (if specified)
  const shouldFetchVaultConfig =
    enabled &&
    passesProductFilter &&
    !!vaultAddress &&
    (!oracleAddress || !unitOfAccount || !assetAddress) &&
    (forceOnchain || (indexerResolved && !hasIndexerPrice))

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
      {
        address: vaultAddress,
        abi: eVaultImplementationAbi,
        functionName: 'asset',
        chainId: effectiveChainId,
      },
    ],
    query: {
      enabled: shouldFetchVaultConfig,
      staleTime: Infinity, // Oracle/unitOfAccount/asset don't change - cache indefinitely
    },
  })

  const finalOracleAddress = oracleAddress || (vaultConfigData?.[0]?.result as Address | undefined)
  const finalUnitOfAccount = unitOfAccount || (vaultConfigData?.[1]?.result as Address | undefined)
  const finalAssetAddress = assetAddress || (vaultConfigData?.[2]?.result as Address | undefined)

  const shouldFetchOracle =
    enabled &&
    passesProductFilter &&
    (forceOnchain || !hasIndexerPrice) &&
    !!finalOracleAddress &&
    !!finalUnitOfAccount &&
    !!finalAssetAddress

  const vaultOraclePrice = useVaultOraclePrice({
    assetAddress: finalAssetAddress,
    oracleAddress: finalOracleAddress,
    unitOfAccount: finalUnitOfAccount,
    chainId: effectiveChainId,
    enabled: shouldFetchOracle,
    config,
  })

  // If vault doesn't pass product filter, return early with no price
  if (!passesProductFilter) {
    return {
      priceUSD: 0,
      isLoading: false,
      isError: false,
      error: null,
      source: 'none',
    }
  }

  if (indexerPrice !== null && indexerPrice > 0) {
    return {
      priceUSD: indexerPrice,
      isLoading: false,
      isError: false,
      error: null,
      source: 'indexer',
    }
  }

  const isLoading = indexerPrices.isLoading || isVaultConfigLoading || vaultOraclePrice.isLoading
  const isError = isVaultConfigError || vaultOraclePrice.isError
  const error = vaultConfigError ?? vaultOraclePrice.error ?? null

  let source: 'vaultOracle' | 'indexer' | 'none'
  if (vaultOraclePrice.source === 'onchain') {
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
