'use client'

import type { Address } from 'viem'
import { useIndexerVaultData } from './useIndexerVaultData'
import { useVaultLensData } from './useVaultLensData'
import type {
  VaultCategory,
  VaultInfo,
  VaultInfoSource,
  PartialVaultInfo,
  UseVaultInfoOptions,
  UseVaultInfoResult,
} from '../types/vaultInfo'
import {
  INDEXER_CATEGORIES,
  VAULTLENS_ONLY_CATEGORIES,
  OVERLAP_CATEGORIES,
} from '../types/vaultInfo'

export interface UseVaultInfoParams<T extends readonly VaultCategory[]> {
  vaultAddress: Address
  options: UseVaultInfoOptions<T>
  enabled?: boolean
}

function categoriesNeedIndexer(categories: readonly VaultCategory[]): boolean {
  return categories.some(c => INDEXER_CATEGORIES.includes(c))
}

function categoriesNeedVaultLens(categories: readonly VaultCategory[]): boolean {
  return categories.some(c => VAULTLENS_ONLY_CATEGORIES.includes(c))
}

function mergeVaultData(
  indexerData: Partial<VaultInfo> | undefined,
  vaultLensData: Partial<VaultInfo> | undefined,
  categories: readonly VaultCategory[],
  indexerFailed: boolean,
): { data: Partial<VaultInfo> | undefined; source: VaultInfoSource } {
  const source: VaultInfoSource = {
    indexer: false,
    vaultLens: false,
    failedSources: [],
    categoriesFromIndexer: [],
    categoriesFromVaultLens: [],
  }

  if (!indexerData && !vaultLensData) {
    return { data: undefined, source }
  }

  const merged: Partial<VaultInfo> = {}

  for (const category of categories) {
    const isOverlap = OVERLAP_CATEGORIES.includes(category)
    const isIndexerOnly = INDEXER_CATEGORIES.includes(category) && !VAULTLENS_ONLY_CATEGORIES.includes(category)
    const isVaultLensOnly = VAULTLENS_ONLY_CATEGORIES.includes(category)

    let useIndexer = false
    let useVaultLens = false

    if (isVaultLensOnly) {
      useVaultLens = true
    } else if (isIndexerOnly && !isOverlap) {
      useIndexer = !!indexerData && !indexerFailed
      if (!useIndexer) {
        useVaultLens = !!vaultLensData
      }
    } else if (isOverlap) {
      useIndexer = !!indexerData && !indexerFailed
      if (!useIndexer) {
        useVaultLens = !!vaultLensData
      }
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
  target: Partial<VaultInfo>,
  source: Partial<VaultInfo>,
  category: VaultCategory,
): void {
  switch (category) {
    case 'price':
      if (source.assetPrice !== undefined) target.assetPrice = source.assetPrice
      if (source.assetPriceTimestamp !== undefined) target.assetPriceTimestamp = source.assetPriceTimestamp
      break
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
      if (source.totalAssets !== undefined) target.totalAssets = source.totalAssets
      if (source.totalAssetsUSD !== undefined) target.totalAssetsUSD = source.totalAssetsUSD
      if (source.totalBorrows !== undefined) target.totalBorrows = source.totalBorrows
      if (source.totalBorrowsUSD !== undefined) target.totalBorrowsUSD = source.totalBorrowsUSD
      if (source.cash !== undefined) target.cash = source.cash
      if (source.cashUSD !== undefined) target.cashUSD = source.cashUSD
      if (source.totalShares !== undefined) target.totalShares = source.totalShares
      if (source.utilization !== undefined) target.utilization = source.utilization
      break
    case 'apy':
      if (source.supplyAPY !== undefined) target.supplyAPY = source.supplyAPY
      if (source.borrowAPY !== undefined) target.borrowAPY = source.borrowAPY
      if (source.totalAPY !== undefined) target.totalAPY = source.totalAPY
      if (source.rewardAPY !== undefined) target.rewardAPY = source.rewardAPY
      if (source.baseAPY !== undefined) target.baseAPY = source.baseAPY
      break
    case 'caps':
      if (source.supplyCap !== undefined) target.supplyCap = source.supplyCap
      if (source.borrowCap !== undefined) target.borrowCap = source.borrowCap
      if (source.supplyCapPercentage !== undefined) target.supplyCapPercentage = source.supplyCapPercentage
      break
    case 'collateral':
      if (source.collateralLTVs !== undefined) target.collateralLTVs = source.collateralLTVs
      if (source.exposure !== undefined) target.exposure = source.exposure
      break
    case 'metadata':
      if (source.products !== undefined) target.products = source.products
      if (source.entities !== undefined) target.entities = source.entities
      if (source.rewardsMetadata !== undefined) target.rewardsMetadata = source.rewardsMetadata
      if (source.governorType !== undefined) target.governorType = source.governorType
      if (source.governorAdmin !== undefined) target.governorAdmin = source.governorAdmin
      break
    case 'irmConfig':
      if (source.interestRateModel !== undefined) target.interestRateModel = source.interestRateModel
      if (source.interestRateInfo !== undefined) target.interestRateInfo = source.interestRateInfo
      if (source.interestRateModelInfo !== undefined) target.interestRateModelInfo = source.interestRateModelInfo
      if (source.interestFee !== undefined) target.interestFee = source.interestFee
      break
    case 'feeConfig':
      if (source.protocolFeeShare !== undefined) target.protocolFeeShare = source.protocolFeeShare
      if (source.governorFeeReceiver !== undefined) target.governorFeeReceiver = source.governorFeeReceiver
      if (source.protocolFeeReceiver !== undefined) target.protocolFeeReceiver = source.protocolFeeReceiver
      if (source.accumulatedFeesShares !== undefined) target.accumulatedFeesShares = source.accumulatedFeesShares
      if (source.accumulatedFeesAssets !== undefined) target.accumulatedFeesAssets = source.accumulatedFeesAssets
      break
    case 'liquidation':
      if (source.maxLiquidationDiscount !== undefined) target.maxLiquidationDiscount = source.maxLiquidationDiscount
      if (source.liquidationCoolOffTime !== undefined) target.liquidationCoolOffTime = source.liquidationCoolOffTime
      break
    case 'hooks':
      if (source.hookTarget !== undefined) target.hookTarget = source.hookTarget
      if (source.hookedOperations !== undefined) target.hookedOperations = source.hookedOperations
      if (source.configFlags !== undefined) target.configFlags = source.configFlags
      break
    case 'oracle':
      if (source.oracle !== undefined) target.oracle = source.oracle
      if (source.unitOfAccount !== undefined) target.unitOfAccount = source.unitOfAccount
      if (source.unitOfAccountName !== undefined) target.unitOfAccountName = source.unitOfAccountName
      if (source.unitOfAccountSymbol !== undefined) target.unitOfAccountSymbol = source.unitOfAccountSymbol
      if (source.unitOfAccountDecimals !== undefined) target.unitOfAccountDecimals = source.unitOfAccountDecimals
      break
  }
}

export function useVaultInfo<T extends readonly VaultCategory[]>({
  vaultAddress,
  options,
  enabled = true,
}: UseVaultInfoParams<T>): UseVaultInfoResult<T> {
  const { include, forceOnchain = false } = options
  const categories = include

  const needsIndexer = !forceOnchain && categoriesNeedIndexer(categories)
  const needsVaultLensForCategories = categoriesNeedVaultLens(categories)

  const indexer = useIndexerVaultData({
    vaultAddress,
    enabled: enabled && needsIndexer,
  })

  const indexerFailed = needsIndexer && indexer.isError
  const needsVaultLensFallback = indexerFailed && categories.some(c => OVERLAP_CATEGORIES.includes(c))
  const needsVaultLens = forceOnchain || needsVaultLensForCategories || needsVaultLensFallback

  const vaultLens = useVaultLensData({
    vaultAddress,
    enabled: enabled && needsVaultLens,
  })

  const { data, source } = mergeVaultData(
    indexer.data,
    vaultLens.data,
    categories,
    indexerFailed,
  )

  const isLoading = (needsIndexer && indexer.isLoading) || (needsVaultLens && vaultLens.isLoading)
  const isError = (needsIndexer && indexer.isError && !needsVaultLensFallback) || 
                  (needsVaultLens && vaultLens.isError)
  const error = indexer.error ?? vaultLens.error ?? null

  return {
    data: data as PartialVaultInfo<T> | undefined,
    isLoading,
    isError,
    error,
    source,
  }
}
