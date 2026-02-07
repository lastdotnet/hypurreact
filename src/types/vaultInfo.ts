import type { Address } from 'viem'

export const VAULT_CATEGORIES = [
  'price',
  'identity',
  'financials',
  'apy',
  'caps',
  'collateral',
  'metadata',
  'irmConfig',
  'feeConfig',
  'liquidation',
  'hooks',
  'oracle',
] as const

export type VaultCategory = (typeof VAULT_CATEGORIES)[number]

export const INDEXER_CATEGORIES: VaultCategory[] = [
  'price',
  'identity',
  'financials',
  'apy',
  'caps',
  'collateral',
  'metadata',
]

export const VAULTLENS_ONLY_CATEGORIES: VaultCategory[] = [
  'irmConfig',
  'feeConfig',
  'liquidation',
  'hooks',
  'oracle',
]

export const OVERLAP_CATEGORIES: VaultCategory[] = [
  'price',
  'identity',
  'financials',
  'apy',
  'caps',
  'collateral',
]

export interface LTVInfo {
  collateral: Address
  borrowLTV: bigint
  liquidationLTV: bigint
  initialLiquidationLTV: bigint
  targetTimestamp: bigint
  rampDuration: bigint
}

export interface CollateralExposure {
  vault: Address
  collateral: Address
  vaultAsset: Address
  vaultName: string
  borrowLTV: string
  liquidationLTV: string
  initialLiquidationLTV: string
  targetTimestamp: string
  rampDuration: string
}

export interface InterestRateInfo {
  cash: bigint
  borrows: bigint
  borrowSPY: bigint
  borrowAPY: bigint
  supplyAPY: bigint
}

export interface InterestRateModelInfo {
  interestRateModel: Address
  interestRateModelType: number
  interestRateModelParams: `0x${string}`
}

export interface Product {
  name: string
  entity: string[]
  description: string
  isGovernanceLimited: boolean
}

export interface Entity {
  entity: string
  name: string
  logo: string
  description: string
  url: string
  addresses: Record<string, string>
  social: Record<string, string>
}

export interface RewardMetadata {
  reward: Address
  rewardSymbol: string
  rewardDecimals: number
}

export interface VaultInfoPrice {
  assetPrice: number | null
  assetPriceTimestamp: string | null
}

export interface VaultInfoIdentity {
  vault: Address
  vaultName: string
  vaultSymbol: string
  vaultDecimals: number
  asset: Address
  assetName: string
  assetSymbol: string
  assetDecimals: number
}

export interface VaultInfoFinancials {
  totalAssets: bigint
  totalAssetsUSD: number | null
  totalBorrows: bigint
  totalBorrowsUSD: number | null
  cash: bigint
  cashUSD: number | null
  totalShares: bigint
  utilization: number
}

export interface VaultInfoAPY {
  /** Total supply APY (base + intrinsic + reward) - what depositors earn */
  supplyAPY: number
  /** Borrow APY - what borrowers pay (only available from VaultLens) */
  borrowAPY: number
  /** Base lending yield from interest rate model */
  baseAPY: number | null
  /** Yield from underlying staked assets (kHYPE, wstHYPE, beHYPE) */
  intrinsicAPY: number | null
  /** Token incentive rewards */
  rewardAPY: number | null
}

export interface VaultInfoCaps {
  supplyCap: bigint
  borrowCap: bigint
  supplyCapPercentage: number | null
}

export interface VaultInfoCollateral {
  collateralLTVs: LTVInfo[]
  exposure: CollateralExposure[] | null
}

export interface VaultInfoMetadata {
  products: Product[] | null
  entities: Entity[] | null
  rewardsMetadata: RewardMetadata[] | null
  governorType: string | null
  governorAdmin: Address | null
}

export interface VaultInfoIRMConfig {
  interestRateModel: Address | null
  interestRateInfo: InterestRateInfo[] | null
  interestRateModelInfo: InterestRateModelInfo | null
  interestFee: bigint | null
}

export interface VaultInfoFeeConfig {
  protocolFeeShare: bigint | null
  governorFeeReceiver: Address | null
  protocolFeeReceiver: Address | null
  accumulatedFeesShares: bigint | null
  accumulatedFeesAssets: bigint | null
}

export interface VaultInfoLiquidation {
  maxLiquidationDiscount: bigint | null
  liquidationCoolOffTime: bigint | null
}

export interface VaultInfoHooks {
  hookTarget: Address | null
  hookedOperations: bigint | null
  configFlags: bigint | null
}

export interface VaultInfoOracle {
  oracle: Address | null
  unitOfAccount: Address | null
  unitOfAccountName: string | null
  unitOfAccountSymbol: string | null
  unitOfAccountDecimals: number | null
}

export type VaultInfo = VaultInfoPrice &
  VaultInfoIdentity &
  VaultInfoFinancials &
  VaultInfoAPY &
  VaultInfoCaps &
  VaultInfoCollateral &
  VaultInfoMetadata &
  VaultInfoIRMConfig &
  VaultInfoFeeConfig &
  VaultInfoLiquidation &
  VaultInfoHooks &
  VaultInfoOracle

export type CategoryToFields = {
  price: keyof VaultInfoPrice
  identity: keyof VaultInfoIdentity
  financials: keyof VaultInfoFinancials
  apy: keyof VaultInfoAPY
  caps: keyof VaultInfoCaps
  collateral: keyof VaultInfoCollateral
  metadata: keyof VaultInfoMetadata
  irmConfig: keyof VaultInfoIRMConfig
  feeConfig: keyof VaultInfoFeeConfig
  liquidation: keyof VaultInfoLiquidation
  hooks: keyof VaultInfoHooks
  oracle: keyof VaultInfoOracle
}

export type FieldsForCategory<C extends VaultCategory> = CategoryToFields[C]

export type FieldsForCategories<T extends readonly VaultCategory[]> = T[number] extends VaultCategory
  ? CategoryToFields[T[number]]
  : never

export type PartialVaultInfo<T extends readonly VaultCategory[]> = Pick<VaultInfo, FieldsForCategories<T>>

export interface VaultInfoSource {
  indexer: boolean
  vaultLens: boolean
  failedSources: ('indexer' | 'vaultLens')[]
  categoriesFromIndexer: VaultCategory[]
  categoriesFromVaultLens: VaultCategory[]
}

import type { ProductId, ProductsConfig } from './products'

export interface UseVaultInfoOptions<T extends readonly VaultCategory[]> {
  include: T
  forceOnchain?: boolean
  /**
   * Optional product filter. When provided with products config,
   * the hook will return no data if the vault doesn't belong to the specified product.
   */
  product?: ProductId
  /**
   * Products configuration. Required when using the product filter.
   */
  products?: ProductsConfig
}

export interface UseVaultInfoResult<T extends readonly VaultCategory[]> {
  data: PartialVaultInfo<T> | undefined
  isLoading: boolean
  isError: boolean
  error: Error | null
  source: VaultInfoSource
}

export const CATEGORY_PRESETS = {
  price: ['price'] as const,
  card: ['identity', 'price', 'apy'] as const,
  dashboard: ['identity', 'price', 'financials', 'apy', 'caps'] as const,
  full: ['identity', 'price', 'financials', 'apy', 'caps', 'collateral', 'metadata'] as const,
  fullWithOnchain: VAULT_CATEGORIES,
} as const
