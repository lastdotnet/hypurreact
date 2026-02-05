'use client'

import { useQuery } from '@tanstack/react-query'
import { type Address, getAddress } from 'viem'
import { useVaultConfig } from '../context'
import { vaultKeys } from '../utils/queryKeys'
import type {
  VaultInfo,
  LTVInfo,
  CollateralExposure,
  Product,
  Entity,
  RewardMetadata,
} from '../types/vaultInfo'

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

interface IndexerExposure {
  vault: string
  collateral: string
  vaultAsset: string
  vaultName: string
  borrowLTV: string
  liquidationLTV: string
  initialLiquidationLTV: string
  targetTimestamp: string
  rampDuration: string
}

interface IndexerProduct {
  name: string
  entity: string[]
  description: string
  isGovernanceLimited: boolean
}

interface IndexerEntity {
  entity: string
  name: string
  logo: string
  description: string
  url: string
  addresses: Record<string, string>
  social: Record<string, string>
}

interface IndexerVaultItem {
  vault: string
  vaultName?: string
  vaultSymbol?: string
  vaultDecimals?: number
  asset?: string
  assetSymbol?: string
  assetDecimals?: number
  assetPrice: number | null
  assetPriceTimestamp?: string
  totalAssets?: string
  totalAssetsUSD?: number
  totalBorrows?: string
  cash?: string
  cashUSD?: number
  totalShares?: string
  baseApy?: number
  intrinsicApy?: number | null
  rewardApy?: number | null
  totalApy?: number
  utilization?: number
  supplyCap?: string
  borrowCap?: string
  supplyCapPercentage?: number
  exposure?: IndexerExposure[]
  products?: IndexerProduct[]
  entities?: IndexerEntity[]
  rewardsMetadata?: RewardMetadata[]
  governorAdmin?: string
  governorType?: string
}

interface IndexerResponse {
  items: IndexerVaultItem[]
  pagination: {
    page: number
    limit: number
    total: number
  }
}

function transformIndexerData(item: IndexerVaultItem): Partial<VaultInfo> {
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

  return {
    vault: getAddress(item.vault) as Address,
    vaultName: item.vaultName ?? '',
    vaultSymbol: item.vaultSymbol ?? '',
    vaultDecimals: item.vaultDecimals ?? 18,
    asset: item.asset ? getAddress(item.asset) as Address : '0x0000000000000000000000000000000000000000',
    assetName: '',
    assetSymbol: item.assetSymbol ?? '',
    assetDecimals: item.assetDecimals ?? 18,
    
    assetPrice: item.assetPrice,
    assetPriceTimestamp: item.assetPriceTimestamp ?? null,
    
    totalAssets: item.totalAssets ? BigInt(item.totalAssets) : 0n,
    totalAssetsUSD: item.totalAssetsUSD ?? null,
    totalBorrows: item.totalBorrows ? BigInt(item.totalBorrows) : 0n,
    totalBorrowsUSD: null,
    cash: item.cash ? BigInt(item.cash) : 0n,
    cashUSD: item.cashUSD ?? null,
    totalShares: item.totalShares ? BigInt(item.totalShares) : 0n,
    utilization: item.utilization ?? 0,
    
    supplyAPY: item.baseApy ?? 0,
    borrowAPY: 0,
    totalAPY: item.totalApy ?? null,
    rewardAPY: item.rewardApy ?? null,
    baseAPY: item.baseApy ?? null,
    
    supplyCap: item.supplyCap ? BigInt(item.supplyCap) : 0n,
    borrowCap: item.borrowCap ? BigInt(item.borrowCap) : 0n,
    supplyCapPercentage: item.supplyCapPercentage ?? null,
    
    collateralLTVs,
    exposure,
    
    products,
    entities,
    rewardsMetadata: item.rewardsMetadata ?? null,
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

async function fetchIndexerVaultData(
  indexerUrl: string,
  chainId: number,
  vaultAddress: Address,
): Promise<Partial<VaultInfo> | null> {
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

  const data: IndexerResponse = await response.json()
  
  const normalizedVaultAddress = getAddress(vaultAddress)
  const vaultItem = data.items.find(item => {
    try {
      return getAddress(item.vault) === normalizedVaultAddress
    } catch {
      return false
    }
  })

  if (!vaultItem) {
    return null
  }

  return transformIndexerData(vaultItem)
}

export function useIndexerVaultData({
  vaultAddress,
  enabled = true,
}: UseIndexerVaultDataParams): UseIndexerVaultDataResult {
  const config = useVaultConfig()
  
  const hasIndexerUrl = !!config.indexerUrl

  const query = useQuery({
    queryKey: vaultKeys.vaultInfo({ chainId: config.chainId, vaultAddress }),
    queryFn: () => {
      if (!config.indexerUrl) {
        return null
      }
      return fetchIndexerVaultData(config.indexerUrl, config.chainId, vaultAddress)
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
