'use client'

import { useMemo } from 'react'
import { type Address, getAddress } from 'viem'
import { useIndexerData } from './useIndexerData'

export interface IndexerVaultListItem {
  vault: Address
  perspectives: Address[]
}

export interface UseIndexerVaultListResult {
  /**
   * Map of vault address (lowercase) to its perspectives array
   */
  data: Map<string, Address[]> | undefined
  /**
   * Array of all vault addresses from the indexer
   */
  vaults: Address[] | undefined
  /**
   * Whether the query is loading
   */
  isLoading: boolean
  /**
   * Whether the query has errored
   */
  isError: boolean
  /**
   * Error object if the query failed
   */
  error: Error | null
}

/**
 * Hook to fetch the full vault list from the indexer with perspectives data.
 * Used to determine vault verification status without on-chain calls.
 *
 * Derives data from the shared indexer cache (useIndexerData),
 * so multiple hooks calling the indexer share a single API request.
 *
 * @example
 * ```tsx
 * function VaultList() {
 *   const { data: perspectivesMap, vaults, isLoading } = useIndexerVaultList()
 *   const config = useVaultConfig()
 *
 *   const isVerified = (vault: Address) => {
 *     const perspectives = perspectivesMap?.get(vault.toLowerCase())
 *     return perspectives?.some(p =>
 *       p.toLowerCase() === config.governedPerspectiveAddress?.toLowerCase()
 *     ) ?? false
 *   }
 * }
 * ```
 */
export function useIndexerVaultList(): UseIndexerVaultListResult {
  const { data: indexerData, isLoading, isError, error } = useIndexerData()

  // Derive vault list and perspectives map from shared data
  const { vaults, perspectivesMap } = useMemo(() => {
    if (!indexerData?.items) {
      return { vaults: undefined, perspectivesMap: undefined }
    }

    const vaultList: Address[] = []
    const map = new Map<string, Address[]>()

    for (const item of indexerData.items) {
      try {
        const vaultAddress = getAddress(item.vault) as Address
        const normalizedKey = vaultAddress.toLowerCase()
        vaultList.push(vaultAddress)

        const perspectives = (item.perspectives ?? [])
          .map(p => {
            try {
              return getAddress(p) as Address
            } catch {
              return null
            }
          })
          .filter((p): p is Address => p !== null)

        map.set(normalizedKey, perspectives)
      } catch {
        // Skip invalid addresses
      }
    }

    return { vaults: vaultList, perspectivesMap: map }
  }, [indexerData?.items])

  return {
    data: perspectivesMap,
    vaults,
    isLoading,
    isError,
    error,
  }
}
