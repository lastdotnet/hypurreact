'use client'

import { useMemo } from 'react'
import { type Address, getAddress } from 'viem'
import { useIndexerData } from './useIndexerData'
import { isPriceStale } from '../utils/priceUtils'

export type IndexerPriceMap = Record<Address, number | null>

export interface UseIndexerPricesResult {
  data: IndexerPriceMap | undefined
  isLoading: boolean
  isError: boolean
  isSuccess: boolean
  error: Error | null
}

/**
 * Hook to get asset prices for all vaults from the indexer.
 *
 * Derives data from the shared indexer cache (useIndexerData),
 * so multiple hooks calling the indexer share a single API request.
 *
 * Prices older than 15 minutes are treated as stale (null) to trigger
 * on-chain fallback.
 *
 * @example
 * ```tsx
 * function PriceDisplay({ vaultAddress }: { vaultAddress: Address }) {
 *   const { data: prices, isLoading } = useIndexerPrices()
 *
 *   if (isLoading) return <span>Loading...</span>
 *
 *   const price = prices?.[vaultAddress]
 *   return <span>${price?.toFixed(2) ?? 'N/A'}</span>
 * }
 * ```
 */
export function useIndexerPrices(): UseIndexerPricesResult {
  const { data: indexerData, isLoading, isError, isSuccess, error } = useIndexerData()

  // Derive price map from shared indexer data
  const priceMap = useMemo(() => {
    if (!indexerData?.items) return undefined

    const map: IndexerPriceMap = {}
    for (const item of indexerData.items) {
      try {
        const normalizedAddress = getAddress(item.vault) as Address
        // Treat stale prices (>15 minutes old) as null to trigger on-chain fallback
        const isStale = isPriceStale(item.assetPriceTimestamp)
        map[normalizedAddress] = isStale ? null : item.assetPrice
      } catch {
        // Skip invalid addresses
        continue
      }
    }
    return map
  }, [indexerData?.items])

  // If no indexer URL configured, return empty map (not undefined)
  if (!isLoading && !indexerData && !isError) {
    return {
      data: {},
      isLoading: false,
      isError: false,
      isSuccess: true,
      error: null,
    }
  }

  return {
    data: priceMap,
    isLoading,
    isError,
    isSuccess,
    error,
  }
}
