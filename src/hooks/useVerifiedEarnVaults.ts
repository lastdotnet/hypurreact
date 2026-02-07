'use client'

import { useReadContract } from 'wagmi'
import type { Address } from 'viem'
import { useVaultConfig } from '../context/useVaultConfig'
import { basePerspectiveAbi } from '../abis/basePerspectiveAbi'

/**
 * Cache time for verified earn vault array (5 minutes)
 */
const VERIFIED_CACHE_TIME = 5 * 60 * 1000

export interface UseVerifiedEarnVaultsResult {
  /**
   * Array of verified earn vault addresses from the eulerEarnGovernedPerspective contract
   */
  data: readonly Address[] | undefined
  /**
   * Whether the query is currently loading
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
  /**
   * Whether the perspective address is configured
   */
  isConfigured: boolean
}

/**
 * Hook to fetch the verified earn vault array from the eulerEarnGovernedPerspective contract.
 * Results are cached for 5 minutes.
 *
 * @example
 * ```tsx
 * function VerifiedEarnVaultsList() {
 *   const { data: verifiedVaults, isLoading } = useVerifiedEarnVaults()
 *
 *   if (isLoading) return <div>Loading...</div>
 *   if (!verifiedVaults) return <div>No perspective configured</div>
 *
 *   return (
 *     <ul>
 *       {verifiedVaults.map(vault => (
 *         <li key={vault}>{vault}</li>
 *       ))}
 *     </ul>
 *   )
 * }
 * ```
 */
export function useVerifiedEarnVaults(): UseVerifiedEarnVaultsResult {
  const config = useVaultConfig()
  const perspectiveAddress = config.eulerEarnGovernedPerspectiveAddress
  const isConfigured = !!perspectiveAddress

  const { data, isLoading, isError, error } = useReadContract({
    address: perspectiveAddress,
    abi: basePerspectiveAbi,
    functionName: 'verifiedArray',
    chainId: config.chainId,
    query: {
      enabled: isConfigured,
      staleTime: VERIFIED_CACHE_TIME,
      gcTime: VERIFIED_CACHE_TIME,
    },
  })

  return {
    data,
    isLoading: isConfigured && isLoading,
    isError,
    error: error ?? null,
    isConfigured,
  }
}
