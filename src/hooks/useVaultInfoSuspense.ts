'use client'

import type { Address } from 'viem'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useVaultConfig } from '../context'
import { vaultKeys } from '../utils/queryKeys'
import { fetchIndexerData } from './useIndexerData'
import { transformIndexerVaultData } from './useIndexerVaultData'
import type {
  VaultCategory,
  VaultInfo,
  VaultInfoSource,
  PartialVaultInfo,
  UseVaultInfoOptions,
} from '../types/vaultInfo'
import { INDEXER_CATEGORIES } from '../types/vaultInfo'

export interface UseVaultInfoSuspenseParams<T extends readonly VaultCategory[]> {
  vaultAddress: Address
  options: UseVaultInfoOptions<T>
}

export interface UseVaultInfoSuspenseResult<T extends readonly VaultCategory[]> {
  data: PartialVaultInfo<T> | undefined
  source: VaultInfoSource
}

function categoriesNeedIndexer(categories: readonly VaultCategory[]): boolean {
  return categories.some(c => INDEXER_CATEGORIES.includes(c))
}

function mergeVaultData(
  indexerData: Partial<VaultInfo> | undefined,
  categories: readonly VaultCategory[],
): { data: Partial<VaultInfo> | undefined; source: VaultInfoSource } {
  const source: VaultInfoSource = {
    indexer: false,
    vaultLens: false,
    failedSources: [],
    categoriesFromIndexer: [],
    categoriesFromVaultLens: [],
  }

  if (!indexerData) {
    return { data: undefined, source }
  }

  source.indexer = true
  for (const category of categories) {
    if (INDEXER_CATEGORIES.includes(category)) {
      source.categoriesFromIndexer.push(category)
    }
  }

  return { data: indexerData, source }
}

/**
 * Suspense-enabled version of useVaultInfo.
 *
 * This hook will suspend the component until data is loaded, enabling
 * use with React Suspense boundaries and streaming SSR.
 *
 * **Note:** This version only supports indexer categories. For VaultLens-only
 * categories (irmConfig, feeConfig, liquidation, hooks, oracle), use the
 * regular useVaultInfo hook.
 *
 * @param params - Hook parameters
 * @param params.vaultAddress - The vault contract address to fetch data for
 * @param params.options - Configuration options
 * @param params.options.include - Categories to fetch (indexer categories only)
 *
 * @returns Query result with typed data based on requested categories
 *
 * @example
 * ```tsx
 * import { Suspense } from 'react'
 * import { useVaultInfoSuspense, CATEGORY_PRESETS } from '@hypurr/vaults'
 *
 * function VaultCard({ address }: { address: Address }) {
 *   const { data, source } = useVaultInfoSuspense({
 *     vaultAddress: address,
 *     options: { include: CATEGORY_PRESETS.card }
 *   })
 *
 *   return (
 *     <div>
 *       <h2>{data?.vaultName}</h2>
 *       <p>APY: {data?.supplyAPY?.toFixed(2)}%</p>
 *     </div>
 *   )
 * }
 *
 * // Usage with Suspense boundary
 * function App() {
 *   return (
 *     <Suspense fallback={<div>Loading...</div>}>
 *       <VaultCard address="0x..." />
 *     </Suspense>
 *   )
 * }
 * ```
 *
 * @see {@link useVaultInfo} for the non-Suspense version with VaultLens fallback
 */
export function useVaultInfoSuspense<T extends readonly VaultCategory[]>({
  vaultAddress,
  options,
}: UseVaultInfoSuspenseParams<T>): UseVaultInfoSuspenseResult<T> {
  const config = useVaultConfig()
  const { include } = options
  const categories = include

  const needsIndexer = categoriesNeedIndexer(categories)

  if (!needsIndexer) {
    return {
      data: undefined,
      source: {
        indexer: false,
        vaultLens: false,
        failedSources: [],
        categoriesFromIndexer: [],
        categoriesFromVaultLens: [],
      },
    }
  }

  // Use suspense query for the shared indexer data
  const { data: indexerResponse } = useSuspenseQuery({
    queryKey: vaultKeys.indexerVaultList({ chainId: config.chainId }),
    queryFn: () => {
      if (!config.indexerUrl) {
        return null
      }
      return fetchIndexerData(config.indexerUrl, config.chainId, config.onIndexerError)
    },
    staleTime: config.indexerStaleTime ?? 60_000,
    gcTime: 5 * 60 * 1000,
  })

  // Transform the vault data
  let vaultData: Partial<VaultInfo> | undefined
  if (indexerResponse) {
    const item = indexerResponse.items.find(
      v => v.vault.toLowerCase() === vaultAddress.toLowerCase(),
    )
    if (item) {
      vaultData = transformIndexerVaultData(item)
    }
  }

  const { data, source } = mergeVaultData(vaultData, categories)

  return {
    data: data as PartialVaultInfo<T> | undefined,
    source,
  }
}
