import type { QueryClient } from '@tanstack/react-query'
import type { Address } from 'viem'
import { vaultKeys } from './queryKeys'
import { validateIndexerResponse, validateEarnVaultResponse } from './indexerSchema'
import type { VaultConfig } from '../config'

/**
 * Prefetches vault list data into the query cache.
 *
 * Use this for SSR, route preloading, or warming the cache before
 * components mount. The prefetched data will be immediately available
 * to hooks like `useVaultInfo`, `useIndexerVaultData`, and `usePrice`.
 *
 * @param queryClient - TanStack Query client instance
 * @param config - Vault configuration with indexerUrl
 * @returns Promise that resolves when prefetch completes
 *
 * @example Server-side prefetching (Next.js)
 * ```tsx
 * // app/vaults/page.tsx
 * import { prefetchVaultList } from '@hypurr/vaults'
 * import { getQueryClient } from './query-client'
 *
 * export default async function VaultsPage() {
 *   const queryClient = getQueryClient()
 *
 *   await prefetchVaultList(queryClient, {
 *     chainId: 999,
 *     indexerUrl: 'https://indexer.example.com',
 *     usdUnitOfAccount: '0x...',
 *     usdReferenceToken: '0x...',
 *   })
 *
 *   return (
 *     <HydrationBoundary state={dehydrate(queryClient)}>
 *       <VaultList />
 *     </HydrationBoundary>
 *   )
 * }
 * ```
 *
 * @example Route preloading
 * ```tsx
 * // Preload on hover/focus
 * function VaultLink({ address }: { address: Address }) {
 *   const queryClient = useQueryClient()
 *   const config = useVaultConfig()
 *
 *   const handleMouseEnter = () => {
 *     prefetchVaultList(queryClient, config)
 *   }
 *
 *   return (
 *     <Link href={`/vault/${address}`} onMouseEnter={handleMouseEnter}>
 *       View Vault
 *     </Link>
 *   )
 * }
 * ```
 */
export async function prefetchVaultList(
  queryClient: QueryClient,
  config: Pick<VaultConfig, 'chainId' | 'indexerUrl' | 'indexerStaleTime'>,
): Promise<void> {
  const { chainId, indexerUrl, indexerStaleTime } = config

  if (!indexerUrl) {
    console.warn('[@hypurr/vaults] prefetchVaultList: No indexerUrl configured')
    return
  }

  await queryClient.prefetchQuery({
    queryKey: vaultKeys.indexerVaultList({ chainId }),
    queryFn: async () => {
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

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        throw new Error(`Indexer request failed: ${response.status} ${response.statusText}`)
      }

      const rawData = await response.json()
      const validated = validateIndexerResponse(rawData)

      if (!validated) {
        throw new Error('Indexer response failed validation')
      }

      return {
        response: validated,
        items: validated.items,
      }
    },
    staleTime: indexerStaleTime ?? 60_000,
  })
}

/**
 * Prefetches a specific Earn vault's data into the query cache.
 *
 * Use this for SSR or route preloading when you know which Earn vault
 * will be displayed. The prefetched data will be immediately available
 * to `useEarnVaultInfo` and `useIndexerEarnVaultData`.
 *
 * @param queryClient - TanStack Query client instance
 * @param config - Vault configuration with indexerUrl
 * @param vaultAddress - The Earn vault address to prefetch
 * @returns Promise that resolves when prefetch completes
 *
 * @example Server-side prefetching (Next.js)
 * ```tsx
 * // app/earn/[address]/page.tsx
 * import { prefetchEarnVault } from '@hypurr/vaults'
 *
 * export default async function EarnVaultPage({
 *   params,
 * }: {
 *   params: { address: string }
 * }) {
 *   const queryClient = getQueryClient()
 *
 *   await prefetchEarnVault(queryClient, vaultConfig, params.address as Address)
 *
 *   return (
 *     <HydrationBoundary state={dehydrate(queryClient)}>
 *       <EarnVaultDetails address={params.address} />
 *     </HydrationBoundary>
 *   )
 * }
 * ```
 */
export async function prefetchEarnVault(
  queryClient: QueryClient,
  config: Pick<VaultConfig, 'chainId' | 'indexerUrl' | 'indexerStaleTime'>,
  vaultAddress: Address,
): Promise<void> {
  const { chainId, indexerUrl, indexerStaleTime } = config

  if (!indexerUrl) {
    console.warn('[@hypurr/vaults] prefetchEarnVault: No indexerUrl configured')
    return
  }

  await queryClient.prefetchQuery({
    queryKey: vaultKeys.indexerEarnVault({ chainId, vaultAddress }),
    queryFn: async () => {
      const url = `${indexerUrl}/v1/earn/vault?chainId=${chainId}&vaultAddress=${vaultAddress}`

      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        if (response.status === 404) {
          return null
        }
        throw new Error(`Indexer request failed: ${response.status} ${response.statusText}`)
      }

      const rawData = await response.json()
      const validated = validateEarnVaultResponse(rawData)

      if (!validated?.vault) {
        return null
      }

      return validated
    },
    staleTime: indexerStaleTime ?? 60_000,
  })
}

/**
 * Prefetches the Earn vault list into the query cache.
 *
 * @param queryClient - TanStack Query client instance
 * @param config - Vault configuration with indexerUrl
 * @returns Promise that resolves when prefetch completes
 */
export async function prefetchEarnVaultList(
  queryClient: QueryClient,
  config: Pick<VaultConfig, 'chainId' | 'indexerUrl' | 'indexerStaleTime'>,
): Promise<void> {
  const { chainId, indexerUrl, indexerStaleTime } = config

  if (!indexerUrl) {
    console.warn('[@hypurr/vaults] prefetchEarnVaultList: No indexerUrl configured')
    return
  }

  await queryClient.prefetchQuery({
    queryKey: vaultKeys.indexerEarnVaultList({ chainId }),
    queryFn: async () => {
      const url = `${indexerUrl}/v1/earn/vaults?chainId=${chainId}`

      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        throw new Error(`Indexer request failed: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      return data
    },
    staleTime: indexerStaleTime ?? 60_000,
  })
}
