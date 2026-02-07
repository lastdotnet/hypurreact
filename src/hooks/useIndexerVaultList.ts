'use client'

import { useQuery } from '@tanstack/react-query'
import { type Address, getAddress } from 'viem'
import { useVaultConfig } from '../context'
import { vaultKeys } from '../utils/queryKeys'

export interface IndexerVaultListItem {
  vault: Address
  perspectives: Address[]
}

export interface UseIndexerVaultListResult {
  /**
   * Map of vault address to its perspectives array
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

interface IndexerVaultItem {
  vault: string
  perspectives?: string[]
}

interface IndexerResponse {
  items: IndexerVaultItem[]
  pagination: {
    page: number
    limit: number
    total: number
  }
}

async function fetchIndexerVaultList(
  indexerUrl: string,
  chainId: number,
): Promise<{ vaults: Address[]; perspectivesMap: Map<string, Address[]> }> {
  const url = `${indexerUrl}/v2/vault/list?chainId=${chainId}`

  const body = {
    chainId,
    limit: '100', // Max allowed by indexer
    page: '1',
    orderBy: 'totalSupply',
    orderDirection: 'desc',
    onlyInWallet: false,
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new Error(`Indexer request failed: ${response.status} ${response.statusText}`)
  }

  const data: IndexerResponse = await response.json()

  const vaults: Address[] = []
  const perspectivesMap = new Map<string, Address[]>()

  for (const item of data.items) {
    try {
      const vaultAddress = getAddress(item.vault) as Address
      const normalizedKey = vaultAddress.toLowerCase()
      vaults.push(vaultAddress)

      const perspectives = (item.perspectives ?? [])
        .map(p => {
          try {
            return getAddress(p) as Address
          } catch {
            return null
          }
        })
        .filter((p): p is Address => p !== null)

      perspectivesMap.set(normalizedKey, perspectives)
    } catch {
      // Skip invalid addresses
    }
  }

  return { vaults, perspectivesMap }
}

/**
 * Hook to fetch the full vault list from the indexer with perspectives data.
 * Used to determine vault verification status without on-chain calls.
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
  const config = useVaultConfig()
  const hasIndexerUrl = !!config.indexerUrl

  const query = useQuery({
    queryKey: vaultKeys.indexerVaultList({ chainId: config.chainId }),
    queryFn: () => {
      if (!config.indexerUrl) {
        return null
      }
      return fetchIndexerVaultList(config.indexerUrl, config.chainId)
    },
    enabled: hasIndexerUrl,
    staleTime: config.indexerStaleTime ?? 60_000,
    gcTime: 5 * 60 * 1000,
  })

  return {
    data: query.data?.perspectivesMap,
    vaults: query.data?.vaults,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
  }
}
