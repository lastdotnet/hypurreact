'use client'

import type { Address } from 'viem'
import { useIndexerEarnVaultData } from './useIndexerEarnVaultData'
import { useEarnVaultLensData } from './useEarnVaultLensData'
import type {
  EarnVaultCategory,
  EarnVaultInfo,
  EarnVaultInfoSource,
  PartialEarnVaultInfo,
  UseEarnVaultInfoOptions,
  UseEarnVaultInfoResult,
} from '../types/earnVaultInfo'

export interface UseEarnVaultInfoParams<T extends readonly EarnVaultCategory[]> {
  vaultAddress: Address
  options: UseEarnVaultInfoOptions<T>
  enabled?: boolean
}

const INDEXER_CATEGORIES: EarnVaultCategory[] = ['identity', 'financials', 'apy', 'config', 'strategies']
const VAULTLENS_CATEGORIES: EarnVaultCategory[] = ['identity', 'financials', 'config', 'strategies']

function categoriesNeedIndexer(categories: readonly EarnVaultCategory[]): boolean {
  return categories.some(c => INDEXER_CATEGORIES.includes(c))
}

function categoriesNeedVaultLens(categories: readonly EarnVaultCategory[]): boolean {
  // VaultLens is always optional for Earn vaults since indexer covers all categories
  // But it's needed as fallback when indexer fails
  return categories.some(c => VAULTLENS_CATEGORIES.includes(c))
}

function mergeEarnVaultData(
  indexerData: Partial<EarnVaultInfo> | undefined,
  vaultLensData: Partial<EarnVaultInfo> | undefined,
  categories: readonly EarnVaultCategory[],
  indexerFailed: boolean,
): { data: Partial<EarnVaultInfo> | undefined; source: EarnVaultInfoSource } {
  const source: EarnVaultInfoSource = {
    indexer: false,
    vaultLens: false,
    failedSources: [],
    categoriesFromIndexer: [],
    categoriesFromVaultLens: [],
  }

  if (!indexerData && !vaultLensData) {
    return { data: undefined, source }
  }

  const merged: Partial<EarnVaultInfo> = {}

  for (const category of categories) {
    let useIndexer = false
    let useVaultLens = false

    // Prefer indexer, fall back to VaultLens
    if (indexerData && !indexerFailed) {
      useIndexer = true
    } else if (vaultLensData) {
      useVaultLens = true
    }

    const sourceData = useIndexer ? indexerData : useVaultLens ? vaultLensData : undefined

    if (sourceData) {
      if (useIndexer) {
        source.indexer = true
        if (!source.categoriesFromIndexer.includes(category)) {
          source.categoriesFromIndexer.push(category)
        }
      }
      if (useVaultLens) {
        source.vaultLens = true
        if (!source.categoriesFromVaultLens.includes(category)) {
          source.categoriesFromVaultLens.push(category)
        }
      }

      copyFieldsForCategory(merged, sourceData, category)
    }
  }

  if (indexerFailed) {
    source.failedSources.push('indexer')
  }

  return { data: Object.keys(merged).length > 0 ? merged : undefined, source }
}

function copyFieldsForCategory(
  target: Partial<EarnVaultInfo>,
  source: Partial<EarnVaultInfo>,
  category: EarnVaultCategory,
): void {
  switch (category) {
    case 'identity':
      if (source.vault !== undefined) target.vault = source.vault
      if (source.vaultName !== undefined) target.vaultName = source.vaultName
      if (source.vaultSymbol !== undefined) target.vaultSymbol = source.vaultSymbol
      if (source.vaultDecimals !== undefined) target.vaultDecimals = source.vaultDecimals
      if (source.asset !== undefined) target.asset = source.asset
      if (source.assetName !== undefined) target.assetName = source.assetName
      if (source.assetSymbol !== undefined) target.assetSymbol = source.assetSymbol
      if (source.assetDecimals !== undefined) target.assetDecimals = source.assetDecimals
      break
    case 'financials':
      if (source.totalShares !== undefined) target.totalShares = source.totalShares
      if (source.totalAssets !== undefined) target.totalAssets = source.totalAssets
      if (source.totalAssetsUSD !== undefined) target.totalAssetsUSD = source.totalAssetsUSD
      if (source.availableAssets !== undefined) target.availableAssets = source.availableAssets
      if (source.availableAssetsUSD !== undefined) target.availableAssetsUSD = source.availableAssetsUSD
      if (source.lostAssets !== undefined) target.lostAssets = source.lostAssets
      break
    case 'apy':
      if (source.apy7d !== undefined) target.apy7d = source.apy7d
      if (source.apy30d !== undefined) target.apy30d = source.apy30d
      if (source.apy90d !== undefined) target.apy90d = source.apy90d
      if (source.apyCurrent !== undefined) target.apyCurrent = source.apyCurrent
      break
    case 'config':
      if (source.performanceFee !== undefined) target.performanceFee = source.performanceFee
      if (source.feeReceiver !== undefined) target.feeReceiver = source.feeReceiver
      if (source.timelock !== undefined) target.timelock = source.timelock
      if (source.owner !== undefined) target.owner = source.owner
      if (source.creator !== undefined) target.creator = source.creator
      if (source.curator !== undefined) target.curator = source.curator
      if (source.guardian !== undefined) target.guardian = source.guardian
      if (source.evc !== undefined) target.evc = source.evc
      if (source.permit2 !== undefined) target.permit2 = source.permit2
      break
    case 'strategies':
      if (source.supplyQueue !== undefined) target.supplyQueue = source.supplyQueue
      if (source.strategies !== undefined) target.strategies = source.strategies
      break
  }
}

export function useEarnVaultInfo<T extends readonly EarnVaultCategory[]>({
  vaultAddress,
  options,
  enabled = true,
}: UseEarnVaultInfoParams<T>): UseEarnVaultInfoResult<T> {
  const { include, forceOnchain = false } = options
  const categories = include

  const needsIndexer = !forceOnchain && categoriesNeedIndexer(categories)

  const indexer = useIndexerEarnVaultData({
    vaultAddress,
    enabled: enabled && needsIndexer,
  })

  const indexerFailed = needsIndexer && indexer.isError
  const needsVaultLensFallback = indexerFailed && categoriesNeedVaultLens(categories)
  const needsVaultLens = forceOnchain || needsVaultLensFallback

  const vaultLens = useEarnVaultLensData({
    vaultAddress,
    enabled: enabled && needsVaultLens,
  })

  const { data, source } = mergeEarnVaultData(indexer.data, vaultLens.data, categories, indexerFailed)

  const isLoading = (needsIndexer && indexer.isLoading) || (needsVaultLens && vaultLens.isLoading)
  const isError =
    (needsIndexer && indexer.isError && !needsVaultLensFallback) || (needsVaultLens && vaultLens.isError)
  const error = indexer.error ?? vaultLens.error ?? null

  return {
    data: data as PartialEarnVaultInfo<T> | undefined,
    isLoading,
    isError,
    error,
    source,
  }
}
