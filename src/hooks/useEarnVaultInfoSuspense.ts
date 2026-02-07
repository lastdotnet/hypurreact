'use client'

import type { Address } from 'viem'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useVaultConfig } from '../context'
import { vaultKeys } from '../utils/queryKeys'
import type {
  EarnVaultCategory,
  EarnVaultInfo,
  EarnVaultInfoSource,
  PartialEarnVaultInfo,
  UseEarnVaultInfoOptions,
} from '../types/earnVaultInfo'

// Import types for transformation
import { getAddress } from 'viem'
import { isPriceStale } from '../utils/priceUtils'
import {
  validateEarnVaultResponse,
  type ValidatedIndexerEarnVaultResponse,
} from '../utils/indexerSchema'
import type { EarnStrategy, EarnStrategyStatus } from '../types/earnVaultInfo'

export interface UseEarnVaultInfoSuspenseParams<T extends readonly EarnVaultCategory[]> {
  vaultAddress: Address
  options: UseEarnVaultInfoOptions<T>
}

export interface UseEarnVaultInfoSuspenseResult<T extends readonly EarnVaultCategory[]> {
  data: PartialEarnVaultInfo<T> | undefined
  source: EarnVaultInfoSource
}

type IndexerEarnStrategy = NonNullable<ValidatedIndexerEarnVaultResponse['vault']['strategies']>[number]

function getStrategyStatus(strategy: IndexerEarnStrategy): EarnStrategyStatus {
  if (strategy.status) {
    if (strategy.status === 'active') return 'active'
    if (strategy.status === 'pending_removal') return 'pending_removal'
    if (strategy.status === 'removed') return 'removed'
  }
  const removableAt = BigInt(strategy.removableAt ?? '0')
  if (removableAt > 0n && removableAt < BigInt(Math.floor(Date.now() / 1000))) {
    return 'removed'
  }
  if (removableAt > 0n) {
    return 'pending_removal'
  }
  return 'active'
}

function transformIndexerStrategy(strategy: IndexerEarnStrategy): EarnStrategy {
  return {
    strategy: getAddress(strategy.strategy) as Address,
    strategyVaultName: strategy.strategyVaultName ?? '',
    strategyVaultSymbol: strategy.strategyVaultSymbol ?? '',
    allocatedAssets: BigInt(strategy.allocatedAssets ?? '0'),
    allocatedAssetsUSD: strategy.allocatedAssetsUSD ?? null,
    availableAssets: BigInt(strategy.availableAssets ?? '0'),
    currentAllocationCap: BigInt(strategy.currentAllocationCap ?? '0'),
    pendingAllocationCap: BigInt(strategy.pendingAllocationCap ?? '0'),
    pendingAllocationCapValidAt: BigInt(strategy.pendingAllocationCapValidAt ?? '0'),
    removableAt: BigInt(strategy.removableAt ?? '0'),
    status: getStrategyStatus(strategy),
  }
}

function transformIndexerData(data: ValidatedIndexerEarnVaultResponse): Partial<EarnVaultInfo> {
  const vault = data.vault

  const isStale = isPriceStale(vault.timestamp)

  const strategies = (vault.strategies ?? data.strategies ?? []).map(transformIndexerStrategy)
  const supplyQueue = (vault.supplyQueue ?? []).map(addr => getAddress(addr) as Address)

  return {
    vault: getAddress(vault.vault) as Address,
    vaultName: vault.vaultName ?? '',
    vaultSymbol: vault.vaultSymbol ?? '',
    vaultDecimals: vault.vaultDecimals ?? 18,
    asset: vault.asset ? (getAddress(vault.asset) as Address) : '0x0000000000000000000000000000000000000000',
    assetName: vault.assetName ?? '',
    assetSymbol: vault.assetSymbol ?? '',
    assetDecimals: vault.assetDecimals ?? 18,

    totalShares: BigInt(vault.totalShares ?? '0'),
    totalAssets: BigInt(vault.totalAssets ?? '0'),
    totalAssetsUSD: isStale ? null : (vault.totalAssetsUSD ?? null),
    availableAssets: BigInt(vault.availableAssets ?? '0'),
    availableAssetsUSD: isStale ? null : (vault.availableAssetsUSD ?? null),
    lostAssets: BigInt(vault.lostAssets ?? '0'),

    apy7d: vault.apy7d ?? null,
    apy30d: vault.apy30d ?? null,
    apy90d: vault.apy90d ?? null,
    apyCurrent: vault.apyCurrent ?? null,

    performanceFee: BigInt(vault.performanceFee ?? '0'),
    feeReceiver: vault.feeReceiver
      ? (getAddress(vault.feeReceiver) as Address)
      : '0x0000000000000000000000000000000000000000',
    timelock: BigInt(vault.timelock ?? '0'),
    owner: vault.owner
      ? (getAddress(vault.owner) as Address)
      : '0x0000000000000000000000000000000000000000',
    creator: vault.creator
      ? (getAddress(vault.creator) as Address)
      : '0x0000000000000000000000000000000000000000',
    curator: vault.curator
      ? (getAddress(vault.curator) as Address)
      : '0x0000000000000000000000000000000000000000',
    guardian: vault.guardian
      ? (getAddress(vault.guardian) as Address)
      : '0x0000000000000000000000000000000000000000',
    evc: vault.evc
      ? (getAddress(vault.evc) as Address)
      : '0x0000000000000000000000000000000000000000',
    permit2: vault.permit2
      ? (getAddress(vault.permit2) as Address)
      : '0x0000000000000000000000000000000000000000',

    supplyQueue,
    strategies,
  }
}

async function fetchEarnVaultData(
  indexerUrl: string,
  chainId: number,
  vaultAddress: Address,
): Promise<Partial<EarnVaultInfo> | null> {
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
  const data = validateEarnVaultResponse(rawData)
  if (!data?.vault) {
    return null
  }

  return transformIndexerData(data)
}

/**
 * Suspense-enabled version of useEarnVaultInfo.
 *
 * This hook will suspend the component until data is loaded, enabling
 * use with React Suspense boundaries and streaming SSR.
 *
 * @param params - Hook parameters
 * @param params.vaultAddress - The Earn vault contract address
 * @param params.options - Configuration options
 * @param params.options.include - Categories to fetch
 *
 * @returns Query result with typed data based on requested categories
 *
 * @example
 * ```tsx
 * import { Suspense } from 'react'
 * import { useEarnVaultInfoSuspense, EARN_CATEGORY_PRESETS } from '@hypurr/vaults'
 *
 * function EarnVaultCard({ address }: { address: Address }) {
 *   const { data, source } = useEarnVaultInfoSuspense({
 *     vaultAddress: address,
 *     options: { include: EARN_CATEGORY_PRESETS.dashboard }
 *   })
 *
 *   return (
 *     <div>
 *       <h2>{data?.vaultName}</h2>
 *       <p>7d APY: {data?.apy7d?.toFixed(2)}%</p>
 *     </div>
 *   )
 * }
 *
 * // Usage with Suspense boundary
 * function App() {
 *   return (
 *     <Suspense fallback={<div>Loading...</div>}>
 *       <EarnVaultCard address="0x..." />
 *     </Suspense>
 *   )
 * }
 * ```
 *
 * @see {@link useEarnVaultInfo} for the non-Suspense version with VaultLens fallback
 */
export function useEarnVaultInfoSuspense<T extends readonly EarnVaultCategory[]>({
  vaultAddress,
  options,
}: UseEarnVaultInfoSuspenseParams<T>): UseEarnVaultInfoSuspenseResult<T> {
  const config = useVaultConfig()
  const categories = options.include

  const source: EarnVaultInfoSource = {
    indexer: false,
    vaultLens: false,
    failedSources: [],
    categoriesFromIndexer: [],
    categoriesFromVaultLens: [],
  }

  if (!config.indexerUrl) {
    return {
      data: undefined,
      source,
    }
  }

  // Use suspense query for the Earn vault data
  const { data } = useSuspenseQuery({
    queryKey: vaultKeys.indexerEarnVault({ chainId: config.chainId, vaultAddress }),
    queryFn: () => fetchEarnVaultData(config.indexerUrl!, config.chainId, vaultAddress),
    staleTime: config.indexerStaleTime ?? 60_000,
    gcTime: 5 * 60 * 1000,
  })

  if (data) {
    source.indexer = true
    source.categoriesFromIndexer = [...categories]
  }

  return {
    data: data as PartialEarnVaultInfo<T> | undefined,
    source,
  }
}
