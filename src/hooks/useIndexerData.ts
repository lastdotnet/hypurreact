'use client'

import { useQuery } from '@tanstack/react-query'
import { useVaultConfig } from '../context'
import { vaultKeys } from '../utils/queryKeys'
import {
  validateIndexerResponse,
  type ValidatedIndexerResponse,
  type ValidatedIndexerVaultItem,
} from '../utils/indexerSchema'

/**
 * Raw indexer data shared across all indexer-derived hooks.
 * This is the single source of truth for indexer API data.
 */
export interface IndexerData {
  /** Raw validated response from indexer */
  response: ValidatedIndexerResponse
  /** All vault items, validated */
  items: ValidatedIndexerVaultItem[]
}

export interface UseIndexerDataResult {
  /** Validated indexer data */
  data: IndexerData | undefined
  /** Whether the query is loading */
  isLoading: boolean
  /** Whether the query has errored */
  isError: boolean
  /** Whether the query succeeded */
  isSuccess: boolean
  /** Error object if failed */
  error: Error | null
}

const DEFAULT_STALE_TIME = 60_000

/**
 * Fetches vault data from the indexer API with validation.
 * @internal Exported for use by Suspense hooks
 */
export async function fetchIndexerData(
  indexerUrl: string,
  chainId: number,
  onIndexerError?: (error: Error) => void,
): Promise<IndexerData> {
  const url = `${indexerUrl}/v2/vault/list?chainId=${chainId}`

  const body = {
    chainId,
    limit: '100',
    page: '1',
    orderBy: 'totalSupply',
    orderDirection: 'desc',
    onlyInWallet: false,
    settings: {
      disableIntrinsicApy: false,
      disableRewardsApy: false,
    },
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const error = new Error(`Indexer request failed: ${response.status} ${response.statusText}`)
      onIndexerError?.(error)
      throw error
    }

    const rawData = await response.json()

    // Validate response with Zod schema
    const validated = validateIndexerResponse(rawData)
    if (!validated) {
      const error = new Error('Indexer response failed validation')
      onIndexerError?.(error)
      throw error
    }

    return {
      response: validated,
      items: validated.items,
    }
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    onIndexerError?.(err)
    throw err
  }
}

/**
 * Base hook that fetches and caches indexer data.
 *
 * This is the single source of truth for indexer API data.
 * Other hooks (useIndexerPrices, useIndexerVaultData, useIndexerVaultList)
 * derive their data from this shared cache.
 *
 * Benefits:
 * - Single API call instead of multiple
 * - Shared cache across all derived hooks
 * - Validated data with Zod schemas
 *
 * @internal This hook is used internally by other indexer hooks.
 * Prefer using the specific hooks (useIndexerPrices, useIndexerVaultData) directly.
 */
export function useIndexerData(): UseIndexerDataResult {
  const config = useVaultConfig()
  const { chainId, indexerUrl, indexerStaleTime, onIndexerError } = config
  const hasIndexerUrl = !!indexerUrl

  const query = useQuery({
    // All derived hooks share this query key for cache deduplication
    queryKey: vaultKeys.indexerVaultList({ chainId }),
    queryFn: () => {
      if (!indexerUrl) {
        return null
      }
      return fetchIndexerData(indexerUrl, chainId, onIndexerError)
    },
    enabled: hasIndexerUrl,
    staleTime: indexerStaleTime ?? DEFAULT_STALE_TIME,
    gcTime: 5 * 60 * 1000,
  })

  return {
    data: query.data ?? undefined,
    isLoading: query.isLoading,
    isError: query.isError,
    isSuccess: query.isSuccess,
    error: query.error,
  }
}
