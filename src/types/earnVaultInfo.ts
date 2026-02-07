import type { Address } from 'viem'

export const EARN_VAULT_CATEGORIES = [
  'identity',
  'financials',
  'apy',
  'config',
  'strategies',
] as const

export type EarnVaultCategory = (typeof EARN_VAULT_CATEGORIES)[number]

export type EarnStrategyStatus = 'active' | 'pending_removal' | 'removed'

export interface EarnStrategy {
  strategy: Address
  strategyVaultName: string
  strategyVaultSymbol: string
  allocatedAssets: bigint
  allocatedAssetsUSD: number | null
  availableAssets: bigint
  currentAllocationCap: bigint
  pendingAllocationCap: bigint
  pendingAllocationCapValidAt: bigint
  removableAt: bigint
  status: EarnStrategyStatus
}

export interface EarnVaultInfoIdentity {
  vault: Address
  vaultName: string
  vaultSymbol: string
  vaultDecimals: number
  asset: Address
  assetName: string
  assetSymbol: string
  assetDecimals: number
}

export interface EarnVaultInfoFinancials {
  totalShares: bigint
  totalAssets: bigint
  totalAssetsUSD: number | null
  availableAssets: bigint
  availableAssetsUSD: number | null
  lostAssets: bigint
}

export interface EarnVaultInfoAPY {
  apy7d: number | null
  apy30d: number | null
  apy90d: number | null
  apyCurrent: number | null
}

export interface EarnVaultInfoConfig {
  performanceFee: bigint
  feeReceiver: Address
  timelock: bigint
  owner: Address
  creator: Address
  curator: Address
  guardian: Address
  evc: Address
  permit2: Address
}

export interface EarnVaultInfoStrategies {
  supplyQueue: Address[]
  strategies: EarnStrategy[]
}

export type EarnVaultInfo = EarnVaultInfoIdentity &
  EarnVaultInfoFinancials &
  EarnVaultInfoAPY &
  EarnVaultInfoConfig &
  EarnVaultInfoStrategies

export type EarnCategoryToFields = {
  identity: keyof EarnVaultInfoIdentity
  financials: keyof EarnVaultInfoFinancials
  apy: keyof EarnVaultInfoAPY
  config: keyof EarnVaultInfoConfig
  strategies: keyof EarnVaultInfoStrategies
}

export type EarnFieldsForCategory<C extends EarnVaultCategory> = EarnCategoryToFields[C]

export type EarnFieldsForCategories<T extends readonly EarnVaultCategory[]> =
  T[number] extends EarnVaultCategory ? EarnCategoryToFields[T[number]] : never

export type PartialEarnVaultInfo<T extends readonly EarnVaultCategory[]> = Pick<
  EarnVaultInfo,
  EarnFieldsForCategories<T>
>

export interface EarnVaultInfoSource {
  indexer: boolean
  vaultLens: boolean
  failedSources: ('indexer' | 'vaultLens')[]
  categoriesFromIndexer: EarnVaultCategory[]
  categoriesFromVaultLens: EarnVaultCategory[]
}

export interface UseEarnVaultInfoOptions<T extends readonly EarnVaultCategory[]> {
  include: T
  forceOnchain?: boolean
}

export interface UseEarnVaultInfoResult<T extends readonly EarnVaultCategory[]> {
  data: PartialEarnVaultInfo<T> | undefined
  isLoading: boolean
  isError: boolean
  error: Error | null
  source: EarnVaultInfoSource
}

export const EARN_CATEGORY_PRESETS = {
  identity: ['identity'] as const,
  card: ['identity', 'apy'] as const,
  dashboard: ['identity', 'financials', 'apy'] as const,
  full: ['identity', 'financials', 'apy', 'config', 'strategies'] as const,
} as const
