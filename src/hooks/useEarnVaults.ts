'use client'

import { useMemo } from 'react'
import type { Address } from 'viem'
import { getAddress } from 'viem'
import { useVerifiedEarnVaults } from './useVerifiedEarnVaults'

export interface UseEarnVaultsParams {
  /**
   * Array of all earn vault addresses to consider.
   * This should come from your application's vault list or the indexer.
   */
  vaults: readonly Address[]
  /**
   * When true, only return earn vaults that are in the eulerEarnGovernedPerspective verifiedArray.
   * Requires eulerEarnGovernedPerspectiveAddress to be configured in VaultConfig.
   * @default false
   */
  verified?: boolean
}

export interface UseEarnVaultsResult {
  /**
   * Filtered array of earn vault addresses
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
   * The set of verified earn vault addresses (for external use)
   */
  verifiedSet: Set<string>
}

/**
 * Hook to get a filtered list of earn vaults with optional verified-only filtering.
 *
 * When `verified` is true, only vaults that appear in the eulerEarnGovernedPerspective's
 * verifiedArray will be returned. The verified array is cached for 5 minutes.
 *
 * @example
 * ```tsx
 * function EarnVaultList() {
 *   const allEarnVaults = ['0x...', '0x...'] // from indexer or config
 *   const [showVerifiedOnly, setShowVerifiedOnly] = useState(false)
 *
 *   const { vaults, count, isLoading } = useEarnVaults({
 *     vaults: allEarnVaults,
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
 *       <ul>
 *         {vaults.map(vault => <li key={vault}>{vault}</li>)}
 *       </ul>
 *     </div>
 *   )
 * }
 * ```
 */
export function useEarnVaults({ vaults, verified = false }: UseEarnVaultsParams): UseEarnVaultsResult {
  const {
    data: verifiedVaults,
    isLoading: isVerifiedLoading,
    isConfigured: isPerspectiveConfigured,
  } = useVerifiedEarnVaults()

  // Create a set of verified addresses for O(1) lookup
  const verifiedSet = useMemo(() => {
    if (!verifiedVaults) return new Set<string>()
    return new Set(verifiedVaults.map(addr => getAddress(addr).toLowerCase()))
  }, [verifiedVaults])

  // Filter vaults based on verified flag
  const filteredVaults = useMemo(() => {
    if (!verified) {
      return vaults as Address[]
    }

    // If verified filter is requested but perspective isn't configured or data not loaded,
    // return empty array
    if (!isPerspectiveConfigured || !verifiedVaults) {
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
  }, [vaults, verified, isPerspectiveConfigured, verifiedVaults, verifiedSet])

  return {
    vaults: filteredVaults,
    count: filteredVaults.length,
    isVerifiedFilter: verified,
    isLoading: verified && isVerifiedLoading,
    isPerspectiveConfigured,
    verifiedSet,
  }
}
