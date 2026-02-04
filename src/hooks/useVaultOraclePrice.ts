'use client'

import { Address, formatUnits } from 'viem'
import { useReadContract } from 'wagmi'
import { erc20Abi, eulerOraclePriceAbi } from '../abis'
import type { OracleConfig } from '../config'
import { useOracleConfig } from '../context'

/**
 * Parameters for the useVaultOraclePrice hook.
 */
export interface UseVaultOraclePriceParams {
  /** The asset address to get price for */
  assetAddress?: Address
  /** The vault's oracle address */
  oracleAddress?: Address
  /** The vault's unit of account address */
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
 * Result returned by the useVaultOraclePrice hook.
 */
export interface UseVaultOraclePriceResult {
  /** Asset price in USD */
  priceUSD: number
  /** Whether the price is loading */
  isLoading: boolean
  /** Whether there was an error fetching the price */
  isError: boolean
  /** Error object if query failed */
  error: Error | null
  /** Price in unit of account (raw bigint) */
  priceInUoA?: bigint
  /** Unit of account to USD price (raw bigint) */
  uoaToUSD?: bigint
  /** Source of the price: 'indexer' if from indexerPrice, 'onchain' if from contracts, 'none' if unavailable */
  source: 'indexer' | 'onchain' | 'none'
}

/**
 * Low-level hook to get asset price in USD via vault's oracle.
 *
 * This hook fetches the price of an asset in USD by querying the vault's oracle contract.
 * It supports a dual-source approach where indexer prices take priority over on-chain queries
 * for performance optimization.
 *
 * **Price Resolution Priority:**
 * 1. If `indexerPrice` is provided and valid (> 0), it's returned immediately
 * 2. Otherwise, the hook queries on-chain:
 *    - Asset decimals from the asset's ERC20 contract
 *    - Unit of account decimals (if UoA is not USD)
 *    - Price in UoA from the vault's oracle
 *    - UoA to USD price from the router (if UoA is not USD)
 *
 * @example
 * ```tsx
 * import { useVaultOraclePrice } from '@hypurr/oracle-react'
 *
 * function AssetPrice({ assetAddress, oracleAddress, unitOfAccount }) {
 *   const { priceUSD, isLoading, isError, error, source } = useVaultOraclePrice({
 *     assetAddress,
 *     oracleAddress,
 *     unitOfAccount,
 *     // Optional: provide indexer price for faster response
 *     indexerPrice: indexerData?.price,
 *   })
 *
 *   if (isLoading) return <span>Loading...</span>
 *   if (isError) return <span>Error: {error?.message}</span>
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
 * @example
 * ```tsx
 * // With config override (bypassing context)
 * const { priceUSD } = useVaultOraclePrice({
 *   assetAddress: '0x...',
 *   oracleAddress: '0x...',
 *   unitOfAccount: '0x...',
 *   config: {
 *     chainId: 1,
 *     routerAddress: '0x...',
 *     usdUnitOfAccount: '0x...',
 *     usdReferenceToken: '0x...',
 *   },
 * })
 * ```
 *
 * @param params - The parameters for the price query
 * @returns The price result with USD value, loading state, error state, and source indicator
 */
export function useVaultOraclePrice({
  assetAddress,
  oracleAddress,
  unitOfAccount,
  chainId,
  enabled = true,
  indexerPrice,
  config: configOverride,
}: UseVaultOraclePriceParams): UseVaultOraclePriceResult {
  // Get config from context or use override
  const contextConfig = useOracleConfig()
  const config = configOverride ?? contextConfig

  const effectiveChainId = chainId ?? config.chainId

  // If indexer price is available and valid, use it as primary
  const hasIndexerPrice = indexerPrice !== undefined && indexerPrice !== null && indexerPrice > 0

  // Only fetch onchain if indexer price is not available
  const shouldFetchOnchain = enabled && !hasIndexerPrice

  const isUSDUnitOfAccount = unitOfAccount === config.usdUnitOfAccount

  // Fetch the asset's decimals (only if we need onchain price)
  const {
    data: assetDecimals,
    isLoading: isDecimalsLoading,
    isError: isDecimalsError,
    error: decimalsError,
  } = useReadContract({
    address: assetAddress,
    abi: erc20Abi,
    functionName: 'decimals',
    chainId: effectiveChainId,
    query: {
      enabled: shouldFetchOnchain && !!assetAddress,
    },
  })

  // Fetch unit of account decimals (skip if it's USD unit of account)
  const {
    data: uoaDecimals,
    isLoading: isUoaDecimalsLoading,
    isError: isUoaDecimalsError,
    error: uoaDecimalsError,
  } = useReadContract({
    address: isUSDUnitOfAccount ? undefined : unitOfAccount,
    abi: erc20Abi,
    functionName: 'decimals',
    chainId: effectiveChainId,
    query: {
      enabled: shouldFetchOnchain && !!unitOfAccount && !isUSDUnitOfAccount,
    },
  })

  const actualUoaDecimals = isUSDUnitOfAccount ? 18 : uoaDecimals

  // Step 1: Get price of asset in terms of unit of account from vault's oracle
  const {
    data: priceInUoA,
    isLoading: isPriceInUoALoading,
    isError: isPriceInUoAError,
    error: priceInUoAError,
  } = useReadContract({
    address: oracleAddress,
    abi: eulerOraclePriceAbi,
    functionName: 'getQuote',
    args:
      assetDecimals !== undefined
        ? [BigInt(10 ** assetDecimals), assetAddress as Address, unitOfAccount as Address]
        : undefined,
    chainId: effectiveChainId,
    query: {
      enabled:
        shouldFetchOnchain &&
        !!oracleAddress &&
        !!assetAddress &&
        !!unitOfAccount &&
        assetDecimals !== undefined &&
        actualUoaDecimals !== undefined,
    },
  })

  // Step 2: Get price of unit of account in USD from Euler Router (skip if UoA is already USD)
  const {
    data: uoaInUSD,
    isLoading: isUoaInUSDLoading,
    isError: isUoaInUSDError,
    error: uoaInUSDError,
  } = useReadContract({
    address: config.routerAddress,
    abi: eulerOraclePriceAbi,
    functionName: 'getQuote',
    args:
      actualUoaDecimals !== undefined
        ? [BigInt(10 ** actualUoaDecimals), unitOfAccount as Address, config.usdReferenceToken]
        : undefined,
    chainId: effectiveChainId,
    query: {
      enabled: shouldFetchOnchain && !!unitOfAccount && !isUSDUnitOfAccount && actualUoaDecimals !== undefined,
    },
  })

  // Use indexer price first if available
  if (hasIndexerPrice) {
    return {
      priceUSD: indexerPrice,
      isLoading: false,
      isError: false,
      error: null,
      priceInUoA: undefined,
      uoaToUSD: undefined,
      source: 'indexer',
    }
  }

  // Aggregate loading and error states
  const isLoading = isDecimalsLoading || isUoaDecimalsLoading || isPriceInUoALoading || isUoaInUSDLoading
  const isError = isDecimalsError || isUoaDecimalsError || isPriceInUoAError || isUoaInUSDError

  // Collect the first error encountered
  const error = decimalsError ?? uoaDecimalsError ?? priceInUoAError ?? uoaInUSDError ?? null

  // Calculate the final onchain price in USD
  let onchainPrice = 0
  if (priceInUoA && uoaInUSD) {
    const assetInUoa = Number(formatUnits(priceInUoA, actualUoaDecimals || 18))
    const uoaToUsd = Number(formatUnits(uoaInUSD, 6)) // USDC has 6 decimals
    onchainPrice = assetInUoa * uoaToUsd
  } else if (priceInUoA && isUSDUnitOfAccount) {
    // If unit of account is USD, then priceInUoA is already in USD
    onchainPrice = Number(formatUnits(priceInUoA, actualUoaDecimals || 18))
  }

  return {
    priceUSD: onchainPrice,
    isLoading,
    isError,
    error,
    priceInUoA,
    uoaToUSD: uoaInUSD,
    source: onchainPrice > 0 ? 'onchain' : 'none',
  }
}
