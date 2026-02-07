'use client'

import { useQuery } from '@tanstack/react-query'
import { type Address, getAddress } from 'viem'
import { useVaultConfig } from '../context'
import { vaultKeys } from '../utils/queryKeys'

export interface UseIndexerEarnVaultListResult {
  /**
   * Array of all earn vault addresses from the indexer
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

interface IndexerEarnVaultItem {
  vault: string
}

interface IndexerEarnVaultsResponse {
  items: IndexerEarnVaultItem[]
  pagination: {
    skip: number
    take: number
    total: number
  }
}

async function fetchIndexerEarnVaultList(
  indexerUrl: string,
  chainId: number,
): Promise<Address[]> {
  const url = `${indexerUrl}/v1/earn/vaults?chainId=${chainId}`

  const response = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  })

  if (!response.ok) {
    throw new Error(`Indexer request failed: ${response.status} ${response.statusText}`)
  }

  const data: IndexerEarnVaultsResponse = await response.json()

  const vaults: Address[] = []

  for (const item of data.items) {
    try {
      const vaultAddress = getAddress(item.vault) as Address
      vaults.push(vaultAddress)
    } catch {
      // Skip invalid addresses
    }
  }

  return vaults
}

/**
 * Hook to fetch the full earn vault list from the indexer.
 * Returns all earn vaults, not just verified ones.
 *
 * @example
 * ```tsx
 * function EarnVaultList() {
 *   const { vaults, isLoading } = useIndexerEarnVaultList()
 *
 *   if (isLoading) return <div>Loading...</div>
 *
 *   return (
 *     <ul>
 *       {vaults?.map(vault => <li key={vault}>{vault}</li>)}
 *     </ul>
 *   )
 * }
 * ```
 */
export function useIndexerEarnVaultList(): UseIndexerEarnVaultListResult {
  const config = useVaultConfig()
  const hasIndexerUrl = !!config.indexerUrl

  const query = useQuery({
    queryKey: vaultKeys.indexerEarnVaultList({ chainId: config.chainId }),
    queryFn: () => {
      if (!config.indexerUrl) {
        return null
      }
      return fetchIndexerEarnVaultList(config.indexerUrl, config.chainId)
    },
    enabled: hasIndexerUrl,
    staleTime: config.indexerStaleTime ?? 60_000,
    gcTime: 5 * 60 * 1000,
  })

  return {
    vaults: query.data ?? undefined,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
  }
}
