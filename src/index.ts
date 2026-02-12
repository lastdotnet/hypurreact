export { createVaultConfig } from './config'
export type { VaultConfig, RetryConfig } from './config'
export {
  vaultKeys,
  calculateAPY,
  calculateAPYFromSharePrices,
  formatAPY,
  formatAPYPercent,
  // Retry utilities
  getRetryOptions,
  retryPresets,
  // Prefetch utilities
  prefetchVaultList,
  prefetchEarnVault,
  prefetchEarnVaultList,
} from './utils'
export { VaultProvider, useVaultConfig } from './context'
export type { VaultProviderProps } from './context'

// Core vault hooks
export {
  useVaultOraclePrice,
  usePrice,
  usePriceQueryOptions,
  useVaultInfo,
  useVaultLensData,
  useIndexerVaultData,
} from './hooks'
export type {
  UseVaultOraclePriceParams,
  UseVaultOraclePriceResult,
  UsePriceParams,
  UsePriceResult,
  UseVaultInfoParams,
  UseVaultLensDataParams,
  UseVaultLensDataResult,
  UseIndexerVaultDataParams,
  UseIndexerVaultDataResult,
} from './hooks'

// Earn vault hooks
export {
  useEarnVaultInfo,
  useEarnVaultLensData,
  useIndexerEarnVaultData,
} from './hooks'
export type {
  UseEarnVaultInfoParams,
  UseEarnVaultLensDataParams,
  UseEarnVaultLensDataResult,
  UseIndexerEarnVaultDataParams,
  UseIndexerEarnVaultDataResult,
} from './hooks'

// Product hooks
export { useProductVaults, useVaultProduct } from './hooks'
export type {
  UseProductVaultsParams,
  UseProductVaultsResult,
  UseVaultProductParams,
  UseVaultProductResult,
} from './hooks'

// Vault info types
export type {
  VaultCategory,
  VaultInfo,
  VaultInfoSource,
  UseVaultInfoOptions,
  UseVaultInfoResult,
  PartialVaultInfo,
  LTVInfo,
  CollateralExposure,
  InterestRateInfo,
  InterestRateModelInfo,
  Product,
  Entity,
  RewardMetadata,
} from './types/vaultInfo'
export { VAULT_CATEGORIES, CATEGORY_PRESETS } from './types/vaultInfo'

// Earn vault info types
export type {
  EarnVaultCategory,
  EarnVaultInfo,
  EarnVaultInfoSource,
  UseEarnVaultInfoOptions,
  UseEarnVaultInfoResult,
  PartialEarnVaultInfo,
  EarnVaultInfoIdentity,
  EarnVaultInfoFinancials,
  EarnVaultInfoAPY,
  EarnVaultInfoConfig,
  EarnVaultInfoStrategies,
  EarnStrategy,
  EarnStrategyStatus,
} from './types/earnVaultInfo'
export { EARN_VAULT_CATEGORIES, EARN_CATEGORY_PRESETS } from './types/earnVaultInfo'

// Product types
export type {
  ProductId,
  ProductConfig,
  ProductsConfig,
} from './types/products'
export {
  getProductVaults,
  isVaultInProduct,
  getProductForVault,
  filterVaultsByProduct,
} from './types/products'

// Vault list hooks with verification
export {
  useVaults,
  useEarnVaults,
  useVerifiedVaults,
  useVerifiedEarnVaults,
} from './hooks'
export type {
  UseVaultsParams,
  UseVaultsResult,
  UseEarnVaultsParams,
  UseEarnVaultsResult,
  UseVerifiedVaultsResult,
  UseVerifiedEarnVaultsResult,
} from './hooks'

// Suspense-enabled hooks for use with React Suspense boundaries
export {
  useVaultInfoSuspense,
  useEarnVaultInfoSuspense,
} from './hooks'
export type {
  UseVaultInfoSuspenseParams,
  UseVaultInfoSuspenseResult,
  UseEarnVaultInfoSuspenseParams,
  UseEarnVaultInfoSuspenseResult,
} from './hooks'

// Error boundary components
export {
  VaultErrorBoundary,
  VaultErrorBoundaryProvider,
  useResetVaultErrorBoundary,
} from './components'
export type {
  VaultErrorBoundaryProps,
  FallbackRenderProps,
} from './components'
