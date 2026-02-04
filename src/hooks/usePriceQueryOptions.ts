import { queryOptions } from '@tanstack/react-query'

import { oracleKeys } from '../utils/queryKeys'
import type { UsePriceParams, UsePriceResult } from './usePrice'

/**
 * Query options factory for price queries.
 *
 * This function returns TanStack Query options for use with manual queries,
 * prefetching, SSR, or cache manipulation. It provides the same query key
 * structure as the `usePrice` hook for seamless cache integration.
 *
 * **Important:** This is a simplified version that returns `indexerPrice` if
 * provided, otherwise returns 0. The full on-chain oracle logic requires React
 * hooks (useReadContract) which cannot be used outside React components.
 *
 * **When to use this instead of `usePrice`:**
 * - Prefetching data before navigation (e.g., in route loaders)
 * - Server-side rendering (SSR) with initial data
 * - Manual cache manipulation (invalidation, updates)
 * - Using with `useQueries` for parallel price fetching
 *
 * @example
 * ```tsx
 * // Prefetch price data before navigation
 * import { usePriceQueryOptions } from '@hypurr/oracle-react'
 * import { useQueryClient } from '@tanstack/react-query'
 *
 * function PrefetchButton({ assetAddress, vaultAddress }) {
 *   const queryClient = useQueryClient()
 *   const queryOptions = usePriceQueryOptions({
 *     assetAddress,
 *     vaultAddress,
 *     chainId: 1,
 *     indexerPrice: 1.0, // Pre-fetched from indexer API
 *   })
 *
 *   const handlePrefetch = () => {
 *     queryClient.prefetchQuery(queryOptions)
 *   }
 *
 *   return <button onClick={handlePrefetch}>Load Price</button>
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Manual cache invalidation using query keys
 * import { usePriceQueryOptions } from '@hypurr/oracle-react'
 * import { useQueryClient } from '@tanstack/react-query'
 *
 * function InvalidateButton({ assetAddress, chainId }) {
 *   const queryClient = useQueryClient()
 *   const { queryKey } = usePriceQueryOptions({
 *     assetAddress,
 *     chainId,
 *   })
 *
 *   const handleInvalidate = () => {
 *     queryClient.invalidateQueries({ queryKey })
 *   }
 *
 *   return <button onClick={handleInvalidate}>Refresh</button>
 * }
 * ```
 *
 * @example
 * ```tsx
 * // SSR with initial data
 * import { usePriceQueryOptions } from '@hypurr/oracle-react'
 * import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query'
 *
 * export async function getServerSideProps() {
 *   const queryClient = new QueryClient()
 *   const queryOptions = usePriceQueryOptions({
 *     assetAddress: '0x...',
 *     chainId: 1,
 *     indexerPrice: 1.0, // Fetched server-side
 *   })
 *
 *   await queryClient.prefetchQuery(queryOptions)
 *
 *   return {
 *     props: {
 *       dehydratedState: dehydrate(queryClient),
 *     },
 *   }
 * }
 * ```
 *
 * @param params - The parameters for the price query
 * @param params.assetAddress - The asset address to get price for
 * @param params.vaultAddress - The vault address (used in query key)
 * @param params.oracleAddress - The oracle address (used in query key)
 * @param params.chainId - Chain ID for the query key (defaults to 1)
 * @param params.enabled - Whether the query is enabled (default: true)
 * @param params.indexerPrice - Price from indexer API (primary data source)
 * @returns TanStack Query options object with queryKey, queryFn, enabled, and staleTime
 */
export function usePriceQueryOptions(params: UsePriceParams) {
  const { assetAddress, oracleAddress, chainId = 1, enabled = true, indexerPrice } = params

  return queryOptions<UsePriceResult>({
    queryKey: oracleKeys.price({
      chainId,
      assetAddress,
      oracleAddress,
    }),

    queryFn: async (): Promise<UsePriceResult> => {
      // Simplified implementation: return indexer price if available
      // Full on-chain logic requires React hooks (useReadContract)
      // which cannot be used in a queryFn
      if (indexerPrice !== undefined && indexerPrice !== null) {
        return {
          priceUSD: indexerPrice,
          isLoading: false,
          isError: false,
          error: null,
          source: 'indexer',
        }
      }

      // Return zero price when indexer price not available
      // On-chain fetching requires React hooks and should use usePrice instead
      return {
        priceUSD: 0,
        isLoading: false,
        isError: false,
        error: null,
        source: 'none',
      }
    },

    enabled,
    staleTime: 60_000, // 1 minute, matching vault config cache
  })
}
