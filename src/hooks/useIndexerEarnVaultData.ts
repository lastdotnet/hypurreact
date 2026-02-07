'use client'

import { useQuery } from '@tanstack/react-query'
import { type Address, getAddress } from 'viem'
import { useVaultConfig } from '../context'
import { vaultKeys } from '../utils/queryKeys'
import { isPriceStale } from '../utils/priceUtils'
import type {
  EarnVaultInfo,
  EarnStrategy,
  EarnStrategyStatus,
} from '../types/earnVaultInfo'

export interface UseIndexerEarnVaultDataParams {
  vaultAddress: Address
  enabled?: boolean
}

export interface UseIndexerEarnVaultDataResult {
  data: Partial<EarnVaultInfo> | undefined
  isLoading: boolean
  isError: boolean
  error: Error | null
}

interface IndexerEarnStrategy {
  strategy: string
  strategyVaultName?: string
  strategyVaultSymbol?: string
  allocatedAssets?: string
  allocatedAssetsUSD?: number
  availableAssets?: string
  currentAllocationCap?: string
  pendingAllocationCap?: string
  pendingAllocationCapValidAt?: string
  removableAt?: string
  status?: string
}

interface IndexerEarnVault {
  vault: string
  vaultName?: string
  vaultSymbol?: string
  vaultDecimals?: number
  asset?: string
  assetName?: string
  assetSymbol?: string
  assetDecimals?: number
  totalShares?: string
  totalAssets?: string
  totalAssetsUSD?: number
  availableAssets?: string
  availableAssetsUSD?: number
  lostAssets?: string
  performanceFee?: string
  feeReceiver?: string
  timelock?: string
  owner?: string
  creator?: string
  curator?: string
  guardian?: string
  evc?: string
  permit2?: string
  supplyQueue?: string[]
  strategies?: IndexerEarnStrategy[]
  apy7d?: number
  apy30d?: number
  apy90d?: number
  apyCurrent?: number
  timestamp?: string
}

interface IndexerEarnResponse {
  vault: IndexerEarnVault
  strategies?: IndexerEarnStrategy[]
}

function getStrategyStatus(strategy: IndexerEarnStrategy): EarnStrategyStatus {
  if (strategy.status) {
    if (strategy.status === 'active') return 'active'
    if (strategy.status === 'pending_removal') return 'pending_removal'
    if (strategy.status === 'removed') return 'removed'
  }
  // Infer status from removableAt if not explicitly set
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

function transformIndexerData(data: IndexerEarnResponse): Partial<EarnVaultInfo> {
  const vault = data.vault

  // Check for stale data
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

async function fetchIndexerEarnVaultData(
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

  const data: IndexerEarnResponse = await response.json()

  if (!data.vault) {
    return null
  }

  return transformIndexerData(data)
}

export function useIndexerEarnVaultData({
  vaultAddress,
  enabled = true,
}: UseIndexerEarnVaultDataParams): UseIndexerEarnVaultDataResult {
  const config = useVaultConfig()

  const hasIndexerUrl = !!config.indexerUrl

  const query = useQuery({
    queryKey: vaultKeys.indexerEarnVault({ chainId: config.chainId, vaultAddress }),
    queryFn: () => {
      if (!config.indexerUrl) {
        return null
      }
      return fetchIndexerEarnVaultData(config.indexerUrl, config.chainId, vaultAddress)
    },
    enabled: enabled && hasIndexerUrl && !!vaultAddress,
    staleTime: config.indexerStaleTime ?? 60_000,
    gcTime: 5 * 60 * 1000,
  })

  return {
    data: query.data ?? undefined,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
  }
}
