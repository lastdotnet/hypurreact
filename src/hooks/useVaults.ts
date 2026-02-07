'use client'

import { useMemo } from 'react'
import type { Address } from 'viem'
import { getAddress } from 'viem'
import { useVaultConfig } from '../context'
import { useIndexerVaultList } from './useIndexerVaultList'
import { useVerifiedVaults } from './useVerifiedVaults'

export interface UseVaultsParams {
  /**
   * Array of all vault addresses to consider.
   * This should come from your application's vault list or the indexer.
   */
  vaults: readonly Address[]
  /**
   * When true, only return vaults that are verified via the governedPerspective.
   * First checks indexer perspectives array, falls back to on-chain verifiedArray.
   * @default false
   */
  verified?: boolean
}

export interface UseVaultsResult {
  /**
   * Filtered array of vault addresses
   */
  vaults: Address[]
  /**
   * Total count of vaults after filtering
   */
  count: number
  /**
   * Whether the verified filter is active
   */
  isVerifiedFilter: boolean
  /**
   * Whether the verification data is loading
   */
  isLoading: boolean
  /**
   * Whether the perspective address is configured (required for verified filter)
   */
  isPerspectiveConfigured: boolean
  /**
   * The set of verified vault addresses (for external use)
   */
  verifiedSet: Set<string>
  /**
   * Source of verification data: 'indexer' | 'onchain' | null
   */
  verificationSource: 'indexer' | 'onchain' | null
}

/**
 * Hook to get a filtered list of vaults with optional verified-only filtering.
 *
 * Verification is checked in order:
 * 1. Indexer `perspectives` array (if indexer data available)
 * 2. On-chain `verifiedArray()` call (fallback)
 *
 * When `verified` is true, only vaults that appear in the governedPerspective
 * will be returned. Results are cached (indexer: 60s, on-chain: 5min).
 *
 * @example
 * ```tsx
 * function VaultList() {
 *   const allVaults = ['0x...', '0x...'] // from indexer or config
 *   const [showVerifiedOnly, setShowVerifiedOnly] = useState(false)
 *
 *   const { vaults, count, isLoading, verificationSource } = useVaults({
 *     vaults: allVaults,
 *     verified: showVerifiedOnly,
 *   })
 *
 *   return (
 *     <div>
 *       <label>
 *         <input
 *           type="checkbox"
 *           checked={showVerifiedOnly}
 *           onChange={e => setShowVerifiedOnly(e.target.checked)}
 *         />
 *         Show verified only ({count} vaults)
 *       </label>
 *       <span>Source: {verificationSource}</span>
 *       <ul>
 *         {vaults.map(vault => <li key={vault}>{vault}</li>)}
 *       </ul>
 *     </div>
 *   )
 * }
 * ```
 */
export function useVaults({ vaults, verified = false }: UseVaultsParams): UseVaultsResult {
  const config = useVaultConfig()
  const governedPerspectiveAddress = config.governedPerspectiveAddress
  const isPerspectiveConfigured = !!governedPerspectiveAddress

  // Indexer source: perspectives array from /v2/vault/list
  const {
    data: indexerPerspectivesMap,
    isLoading: isIndexerLoading,
    isError: isIndexerError,
  } = useIndexerVaultList()

  // On-chain fallback: verifiedArray() from governedPerspective contract
  // Only enable if indexer failed or not available
  const shouldUseOnchain = isIndexerError || (!isIndexerLoading && !indexerPerspectivesMap)
  const {
    data: onchainVerifiedVaults,
    isLoading: isOnchainLoading,
  } = useVerifiedVaults()

  // Determine verification source and build verified set
  const { verifiedSet, verificationSource } = useMemo(() => {
    // Try indexer first
    if (indexerPerspectivesMap && governedPerspectiveAddress) {
      const normalizedPerspective = governedPerspectiveAddress.toLowerCase()
      const set = new Set<string>()

      for (const [vaultAddr, perspectives] of indexerPerspectivesMap) {
        const hasGovernedPerspective = perspectives.some(
          p => p.toLowerCase() === normalizedPerspective
        )
        if (hasGovernedPerspective) {
          set.add(vaultAddr) // Already lowercased in useIndexerVaultList
        }
      }

      return { verifiedSet: set, verificationSource: 'indexer' as const }
    }

    // Fall back to on-chain
    if (onchainVerifiedVaults) {
      const set = new Set(onchainVerifiedVaults.map(addr => getAddress(addr).toLowerCase()))
      return { verifiedSet: set, verificationSource: 'onchain' as const }
    }

    return { verifiedSet: new Set<string>(), verificationSource: null }
  }, [indexerPerspectivesMap, onchainVerifiedVaults, governedPerspectiveAddress])

  // Filter vaults based on verified flag
  const filteredVaults = useMemo(() => {
    if (!verified) {
      return vaults as Address[]
    }

    // If verified filter is requested but no verification data available
    if (verifiedSet.size === 0 && !isIndexerLoading && !isOnchainLoading) {
      return []
    }

    return vaults.filter(vault => {
      try {
        const normalizedAddr = getAddress(vault).toLowerCase()
        return verifiedSet.has(normalizedAddr)
      } catch {
        return false
      }
    }) as Address[]
  }, [vaults, verified, verifiedSet, isIndexerLoading, isOnchainLoading])

  const isLoading = verified && (isIndexerLoading || (shouldUseOnchain && isOnchainLoading))

  return {
    vaults: filteredVaults,
    count: filteredVaults.length,
    isVerifiedFilter: verified,
    isLoading,
    isPerspectiveConfigured,
    verifiedSet,
    verificationSource,
  }
}
