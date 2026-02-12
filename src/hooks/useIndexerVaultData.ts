'use client'

import { useMemo } from 'react'
import { type Address, getAddress, zeroAddress } from 'viem'
import { useIndexerData } from './useIndexerData'
import { isPriceStale } from '../utils/priceUtils'
import type {
  VaultInfo,
  LTVInfo,
  CollateralExposure,
  Product,
  Entity,
  RewardMetadata,
} from '../types/vaultInfo'
import type { ValidatedIndexerVaultItem } from '../utils/indexerSchema'

export interface UseIndexerVaultDataParams {
  vaultAddress: Address
  enabled?: boolean
}

export interface UseIndexerVaultDataResult {
  data: Partial<VaultInfo> | undefined
  isLoading: boolean
  isError: boolean
  error: Error | null
}

/**
 * Transforms a validated indexer vault item into the VaultInfo format.
 * @internal Exported for use by Suspense hooks
 */
export function transformIndexerVaultData(item: ValidatedIndexerVaultItem): Partial<VaultInfo> {
  const collateralLTVs: LTVInfo[] = (item.exposure ?? []).map(exp => ({
    collateral: getAddress(exp.collateral) as Address,
    borrowLTV: BigInt(exp.borrowLTV),
    liquidationLTV: BigInt(exp.liquidationLTV),
    initialLiquidationLTV: BigInt(exp.initialLiquidationLTV),
    targetTimestamp: BigInt(exp.targetTimestamp),
    rampDuration: BigInt(exp.rampDuration),
  }))

  const exposure: CollateralExposure[] | null = item.exposure?.map(exp => ({
    vault: getAddress(exp.vault) as Address,
    collateral: getAddress(exp.collateral) as Address,
    vaultAsset: getAddress(exp.vaultAsset) as Address,
    vaultName: exp.vaultName,
    borrowLTV: exp.borrowLTV,
    liquidationLTV: exp.liquidationLTV,
    initialLiquidationLTV: exp.initialLiquidationLTV,
    targetTimestamp: exp.targetTimestamp,
    rampDuration: exp.rampDuration,
  })) ?? null

  const products: Product[] | null = item.products?.map(p => ({
    name: p.name,
    entity: p.entity,
    description: p.description,
    isGovernanceLimited: p.isGovernanceLimited,
  })) ?? null

  const entities: Entity[] | null = item.entities?.map(e => ({
    entity: e.entity,
    name: e.name,
    logo: e.logo,
    description: e.description,
    url: e.url,
    addresses: e.addresses,
    social: e.social,
  })) ?? null

  // Treat stale prices (>15 minutes old) as null to trigger on-chain fallback
  const isStale = isPriceStale(item.assetPriceTimestamp)

  // Transform rewardsMetadata with proper typing
  const rewardsMetadata: RewardMetadata[] | null = item.rewardsMetadata?.map(r => ({
    reward: getAddress(r.reward) as Address,
    rewardSymbol: r.rewardSymbol,
    rewardDecimals: r.rewardDecimals,
  })) ?? null

  return {
    vault: getAddress(item.vault) as Address,
    vaultName: item.vaultName ?? '',
    vaultSymbol: item.vaultSymbol ?? '',
    vaultDecimals: item.vaultDecimals ?? 18,
    asset: item.asset ? getAddress(item.asset) as Address : zeroAddress,
    assetName: '',
    assetSymbol: item.assetSymbol ?? '',
    assetDecimals: item.assetDecimals ?? 18,

    assetPrice: isStale ? null : item.assetPrice,
    assetPriceTimestamp: item.assetPriceTimestamp ?? null,

    totalAssets: item.totalAssets ? BigInt(item.totalAssets) : 0n,
    totalAssetsUSD: item.totalAssetsUSD ?? null,
    totalBorrows: item.totalBorrows ? BigInt(item.totalBorrows) : 0n,
    totalBorrowsUSD: null,
    cash: item.cash ? BigInt(item.cash) : 0n,
    cashUSD: item.cashUSD ?? null,
    totalShares: item.totalShares ? BigInt(item.totalShares) : 0n,
    utilization: item.utilization ?? 0,

    // supplyAPY = baseApy + intrinsicApy + rewardApy (use totalApy from indexer)
    supplyAPY: item.totalApy ?? item.baseApy ?? 0,
    borrowAPY: 0, // Indexer doesn't provide borrowApy, only available from VaultLens
    baseAPY: item.baseApy ?? null,
    intrinsicAPY: item.intrinsicApy?.apy ?? null,
    rewardAPY: item.rewardApy ?? null,

    supplyCap: item.supplyCap ? BigInt(item.supplyCap) : 0n,
    borrowCap: item.borrowCap ? BigInt(item.borrowCap) : 0n,
    supplyCapPercentage: item.supplyCapPercentage ?? null,

    collateralLTVs,
    exposure,

    products,
    entities,
    rewardsMetadata,
    governorType: item.governorType ?? null,
    governorAdmin: item.governorAdmin ? getAddress(item.governorAdmin) as Address : null,

    interestRateModel: null,
    interestRateInfo: null,
    interestRateModelInfo: null,
    interestFee: null,

    protocolFeeShare: null,
    governorFeeReceiver: null,
    protocolFeeReceiver: null,
    accumulatedFeesShares: null,
    accumulatedFeesAssets: null,

    maxLiquidationDiscount: null,
    liquidationCoolOffTime: null,

    hookTarget: null,
    hookedOperations: null,
    configFlags: null,

    oracle: null,
    unitOfAccount: null,
    unitOfAccountName: null,
    unitOfAccountSymbol: null,
    unitOfAccountDecimals: null,
  }
}

/**
 * Hook to get detailed vault data from the indexer for a specific vault.
 *
 * Derives data from the shared indexer cache (useIndexerData),
 * so multiple hooks calling the indexer share a single API request.
 *
 * @example
 * ```tsx
 * function VaultDetails({ address }: { address: Address }) {
 *   const { data, isLoading, isError } = useIndexerVaultData({
 *     vaultAddress: address,
 *   })
 *
 *   if (isLoading) return <div>Loading...</div>
 *   if (isError) return <div>Error loading vault</div>
 *
 *   return (
 *     <div>
 *       <h2>{data?.vaultName}</h2>
 *       <p>APY: {data?.supplyAPY}%</p>
 *     </div>
 *   )
 * }
 * ```
 */
export function useIndexerVaultData({
  vaultAddress,
  enabled = true,
}: UseIndexerVaultDataParams): UseIndexerVaultDataResult {
  const { data: indexerData, isLoading, isError, error } = useIndexerData()

  // Find and transform the specific vault from shared data
  const vaultData = useMemo(() => {
    if (!enabled || !indexerData?.items || !vaultAddress) return undefined

    const normalizedVaultAddress = getAddress(vaultAddress)
    const vaultItem = indexerData.items.find(item => {
      try {
        return getAddress(item.vault) === normalizedVaultAddress
      } catch {
        return false
      }
    })

    if (!vaultItem) return undefined

    return transformIndexerVaultData(vaultItem)
  }, [indexerData?.items, vaultAddress, enabled])

  // If disabled, return early
  if (!enabled) {
    return {
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
    }
  }

  return {
    data: vaultData,
    isLoading,
    isError,
    error,
  }
}
