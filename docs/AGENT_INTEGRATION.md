# @hypurr/vaults - Agent Integration Guide

Technical reference for integrating Euler vault hooks into React applications.

## Package Overview

```
@hypurr/vaults
├── VaultProvider          # Context provider (required)
├── createVaultConfig      # Config factory
├── useVaultInfo           # Primary hook - multi-category fetch with smart source selection
├── usePrice               # Single asset price hook
├── useVaultOraclePrice    # Low-level on-chain price hook
├── usePriceQueryOptions   # TanStack Query options for prefetching
└── CATEGORY_PRESETS       # Predefined category combinations
```

## Setup Requirements

### 1. Peer Dependencies

```json
{
  "react": "^18.0.0",
  "@tanstack/react-query": ">=5.0.0",
  "wagmi": "^2.0.0",
  "viem": "^2.0.0"
}
```

### 2. Provider Hierarchy

```tsx
<WagmiProvider config={wagmiConfig}>
  <QueryClientProvider client={queryClient}>
    <VaultProvider config={vaultConfig}>
      {/* App */}
    </VaultProvider>
  </QueryClientProvider>
</WagmiProvider>
```

### 3. Configuration

```typescript
import { createVaultConfig } from '@hypurr/vaults'

const config = createVaultConfig({
  chainId: 999,                                              // HyperEVM
  routerAddress: '0x28675f23E149c25f4f672FAD05f4e71DAfb75048', // Euler Oracle Router
  usdUnitOfAccount: '0x0000000000000000000000000000000000000348', // USD virtual address
  usdReferenceToken: '0xb8ce59fc3717ada4c02eadf9682a9e934f625ebb', // USDC
})
```

---

## Hook: `useVaultInfo`

### Purpose
Fetches vault data with automatic source selection and fallback.

### Signature

```typescript
function useVaultInfo<T extends readonly VaultCategory[]>({
  vaultAddress: Address,
  options: { include: T, forceOnchain?: boolean },
  enabled?: boolean,
}): {
  data: PartialVaultInfo<T> | undefined
  isLoading: boolean
  isError: boolean
  error: Error | null
  source: VaultInfoSource
}
```

### Data Categories

| Category | Fields | Source |
|----------|--------|--------|
| `price` | assetPrice, assetPriceTimestamp | Indexer (fallback: VaultLens) |
| `identity` | vault, vaultName, vaultSymbol, vaultDecimals, asset, assetName, assetSymbol, assetDecimals | Indexer (fallback: VaultLens) |
| `financials` | totalAssets, totalAssetsUSD, totalBorrows, totalBorrowsUSD, cash, cashUSD, totalShares, utilization | Indexer (fallback: VaultLens) |
| `apy` | supplyAPY, borrowAPY, totalAPY, rewardAPY, baseAPY | Indexer (fallback: VaultLens) |
| `caps` | supplyCap, borrowCap, supplyCapPercentage | Indexer (fallback: VaultLens) |
| `collateral` | collateralLTVs, exposure | Indexer (fallback: VaultLens) |
| `metadata` | products, entities, rewardsMetadata, governorType, governorAdmin | Indexer only |
| `irmConfig` | interestRateModel, interestRateInfo, interestRateModelInfo, interestFee | VaultLens only |
| `feeConfig` | protocolFeeShare, governorFeeReceiver, protocolFeeReceiver, accumulatedFeesShares, accumulatedFeesAssets | VaultLens only |
| `liquidation` | maxLiquidationDiscount, liquidationCoolOffTime | VaultLens only |
| `hooks` | hookTarget, hookedOperations, configFlags | VaultLens only |
| `oracle` | oracle, unitOfAccount, unitOfAccountName, unitOfAccountSymbol, unitOfAccountDecimals | VaultLens only |

### Source Selection Logic

```
1. Requested categories → determine needed sources
2. Indexer-available categories → query indexer FIRST
3. VaultLens-only categories → query VaultLens
4. If indexer fails for overlap categories → fallback to VaultLens
5. Merge results, return with source metadata
```

### Usage Patterns

**Basic - Single Category:**
```typescript
const { data } = useVaultInfo({
  vaultAddress: '0x...',
  options: { include: ['price'] }
})
// data.assetPrice: number | null
```

**Dashboard - Multiple Categories:**
```typescript
const { data, source } = useVaultInfo({
  vaultAddress: '0x...',
  options: { include: ['identity', 'price', 'financials', 'apy'] }
})
// source.categoriesFromIndexer: ['identity', 'price', 'financials', 'apy']
```

**Hybrid - Indexer + On-chain:**
```typescript
const { data, source } = useVaultInfo({
  vaultAddress: '0x...',
  options: { include: ['price', 'financials', 'irmConfig'] }
})
// source.indexer: true, source.vaultLens: true
// source.categoriesFromIndexer: ['price', 'financials']
// source.categoriesFromVaultLens: ['irmConfig']
```

**Force On-chain:**
```typescript
const { data } = useVaultInfo({
  vaultAddress: '0x...',
  options: { include: ['price'], forceOnchain: true }
})
// Always uses VaultLens
```

### Category Presets

```typescript
import { CATEGORY_PRESETS } from '@hypurr/vaults'

// Use directly
useVaultInfo({ vaultAddress, options: { include: CATEGORY_PRESETS.dashboard } })

// Available presets:
CATEGORY_PRESETS.price           // ['price']
CATEGORY_PRESETS.card            // ['identity', 'price', 'apy']
CATEGORY_PRESETS.dashboard       // ['identity', 'price', 'financials', 'apy', 'caps']
CATEGORY_PRESETS.full            // + collateral, metadata
CATEGORY_PRESETS.fullWithOnchain // ALL categories
```

---

## Hook: `usePrice`

### Purpose
Fetches single asset price with automatic indexer → on-chain fallback.

### Signature

```typescript
function usePrice({
  assetAddress?: Address,
  vaultAddress?: Address,      // Auto-fetches oracle/unitOfAccount if needed
  oracleAddress?: Address,     // Direct oracle (skip vault config fetch)
  unitOfAccount?: Address,     // Direct unit of account
  chainId?: number,
  enabled?: boolean,
  config?: VaultConfig,
}): {
  priceUSD: number
  isLoading: boolean
  isError: boolean
  error: Error | null
  source: 'vaultOracle' | 'indexer' | 'none'
}
```

### Usage

```typescript
// Via vault (auto-fetches oracle config)
const { priceUSD, source } = usePrice({
  assetAddress: '0x...',
  vaultAddress: '0x...',
})

// Direct oracle (skip vault config fetch)
const { priceUSD } = usePrice({
  assetAddress: '0x...',
  oracleAddress: '0x...',
  unitOfAccount: '0x...',
})
```

---

## Hook: `useVaultOraclePrice`

### Purpose
Low-level on-chain price fetch via vault oracle. Used internally by `usePrice`.

### Signature

```typescript
function useVaultOraclePrice({
  assetAddress?: Address,
  oracleAddress: Address,
  unitOfAccount: Address,
  chainId?: number,
  enabled?: boolean,
  config?: VaultConfig,
}): {
  priceUSD: number
  isLoading: boolean
  isError: boolean
  error: Error | null
  priceInUoA?: bigint
  uoaToUSD?: bigint
  source: 'onchain' | 'none'
}
```

---

## Type Definitions

### VaultConfig

```typescript
interface VaultConfig {
  chainId: number
  routerAddress: Address
  usdUnitOfAccount: Address
  usdReferenceToken: Address
}
```

### VaultInfoSource

```typescript
interface VaultInfoSource {
  indexer: boolean
  vaultLens: boolean
  failedSources: ('indexer' | 'vaultLens')[]
  categoriesFromIndexer: VaultCategory[]
  categoriesFromVaultLens: VaultCategory[]
}
```

### VaultCategory

```typescript
type VaultCategory =
  | 'price' | 'identity' | 'financials' | 'apy' | 'caps'
  | 'collateral' | 'metadata' | 'irmConfig' | 'feeConfig'
  | 'liquidation' | 'hooks' | 'oracle'
```

---

## Decision Tree: Which Hook to Use

```
Need vault data?
├── Multiple categories → useVaultInfo
│   └── Pick categories or use CATEGORY_PRESETS
├── Just price → usePrice
│   ├── Have vault address → pass vaultAddress
│   └── Have oracle directly → pass oracleAddress + unitOfAccount
└── Raw on-chain price only → useVaultOraclePrice
```

---

## Error Handling

```typescript
const { data, isLoading, isError, error, source } = useVaultInfo({...})

if (isLoading) {
  // Show skeleton
}

if (isError) {
  // Check source.failedSources for which source failed
  // If overlap category and indexer failed, VaultLens fallback was attempted
}

if (data) {
  // Check source.categoriesFromIndexer vs source.categoriesFromVaultLens
  // to understand data provenance
}
```

---

## Storybook Examples

Interactive examples available via Storybook:

```bash
pnpm storybook
```

| Story | Demonstrates |
|-------|--------------|
| `useVaultInfo / Price Only` | Single category, indexer source |
| `useVaultInfo / Dashboard Preset` | Multiple categories preset |
| `useVaultInfo / With IRM Config` | Hybrid indexer + VaultLens |
| `useVaultInfo / Force VaultLens` | Bypassing indexer |
| `useVaultInfo / Full Data` | All categories |
| `usePrice / *` | Price hook variants |

---

## Common Patterns

### Prefetching

```typescript
import { usePriceQueryOptions } from '@hypurr/vaults'
import { useQueryClient } from '@tanstack/react-query'

const queryClient = useQueryClient()
const queryOptions = usePriceQueryOptions({ assetAddress, vaultAddress })

// Prefetch on hover
<button onMouseEnter={() => queryClient.prefetchQuery(queryOptions)}>
  View Price
</button>
```

### Conditional Fetching

```typescript
const { data } = useVaultInfo({
  vaultAddress,
  options: { include: ['price'] },
  enabled: !!vaultAddress && isConnected,
})
```

### Config Override

```typescript
const { priceUSD } = usePrice({
  assetAddress,
  vaultAddress,
  config: customConfig,  // Override context config
})
```
