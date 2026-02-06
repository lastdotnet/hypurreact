# @hypurr/vaults - Agent Integration Guide

Technical reference for integrating Euler vault hooks into React applications.

---

## Breaking Changes (v0.2.0)

### `routerAddress` Removed from Config

The `routerAddress` field has been removed from `VaultConfig`. Oracle router addresses are now fetched dynamically from each vault via `vault.oracle()`.

**Migration:**

```diff
const config = createVaultConfig({
  chainId: 999,
- routerAddress: '0x28675f23E149c25f4f672FAD05f4e71DAfb75048',
  usdUnitOfAccount: '0x0000000000000000000000000000000000000348',
  usdReferenceToken: '0xb8ce59fc3717ada4c02eadf9682a9e934f625ebb',
})
```

**Why:** Each vault stores its own oracle router address. Fetching it dynamically:
- Eliminates hardcoded addresses from config
- Ensures correct oracle is used per-vault
- Simplifies setup (one less address to configure)

**Impact:** 
- TypeScript error if `routerAddress` is still passed
- No runtime behavior change for `usePrice` (it already fetched oracle from vault)
- `useVaultOraclePrice` now uses `oracleAddress` param for both asset pricing AND UoA→USD conversion

---

## Oracle Address Resolution

Understanding how oracle addresses are resolved is critical for correct integration.

### How It Works

```
EVK Vault Contract
├── oracle()         → Returns oracle router address
├── unitOfAccount()  → Returns unit of account address  
└── asset()          → Returns underlying asset address
```

When you call `usePrice({ vaultAddress })`:
1. If indexer has price → return immediately (no on-chain calls)
2. Otherwise, hook fetches from vault in a single multicall:
   - `vault.oracle()` → oracle router address
   - `vault.unitOfAccount()` → unit of account
   - `vault.asset()` → underlying asset address
3. These are passed to `useVaultOraclePrice` for on-chain price query

### Key Insight

The oracle router address returned by `vault.oracle()` handles ALL price conversions:
- Asset → Unit of Account (e.g., WETH → USD)
- Unit of Account → USD Reference Token (when UoA ≠ USD)

No separate router address is needed in config.

---

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
  usdUnitOfAccount: '0x0000000000000000000000000000000000000348', // USD virtual address
  usdReferenceToken: '0xb8ce59fc3717ada4c02eadf9682a9e934f625ebb', // USDC
})
```

> **Note:** Oracle router addresses are fetched dynamically from each vault via `vault.oracle()`. No hardcoded router address is required in the config.

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
| `price` | assetPrice, assetPriceTimestamp | Indexer (fallback: VaultLens)\* |
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

\* **Price Staleness Check**: Prices older than 15 minutes are treated as unavailable, automatically triggering VaultLens fallback.

### Source Selection Logic

```
1. Requested categories → determine needed sources
2. Indexer-available categories → query indexer FIRST
   2a. Check assetPriceTimestamp for staleness (>15 minutes)
   2b. Treat stale prices as null (triggers fallback)
3. VaultLens-only categories → query VaultLens
4. If indexer fails or returns stale data for overlap categories → fallback to VaultLens
5. Merge results, return with source metadata
```

**Staleness Protection**: Prices older than 15 minutes are automatically treated as unavailable, triggering on-chain fallback to ensure data freshness.

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

### Price Staleness Protection

Both `usePrice` and `useVaultInfo` implement **automatic staleness detection** to protect against outdated indexer data.

**How It Works:**

When the indexer returns prices, the hooks check the `assetPriceTimestamp`:

```typescript
// Prices are considered stale if:
1. Timestamp is older than 15 minutes
2. Timestamp is missing (undefined)
3. Timestamp is invalid (unparseable date)
```

**Behavior:**

```
Fresh Price (<15min old)     → Use indexer price, source: "indexer"
Stale Price (>15min old)     → Set to null, trigger on-chain fallback
Missing/Invalid Timestamp    → Set to null, trigger on-chain fallback
```

**Implementation:**

```typescript
const PRICE_STALENESS_THRESHOLD = 15 * 60 * 1000 // 15 minutes

function isPriceStale(timestamp: string | undefined): boolean {
  if (!timestamp) return true

  try {
    const priceTime = new Date(timestamp).getTime()
    if (isNaN(priceTime)) return true

    const age = Date.now() - priceTime
    return age > PRICE_STALENESS_THRESHOLD
  } catch {
    return true
  }
}

// Applied automatically in useIndexerPrices and useIndexerVaultData
priceMap[vaultAddress] = isPriceStale(timestamp) ? null : price
```

**Why 15 Minutes?**

The threshold balances two concerns:
- **Freshness**: Crypto prices can change significantly in 15 minutes
- **Reliability**: Tolerates normal indexer delays without excessive on-chain calls
- **Safety**: Prevents displaying dangerously outdated prices in volatile markets

**User Experience:**

The staleness check is **transparent** to consumers:
- `usePrice` automatically falls back to on-chain oracle
- `useVaultInfo` falls back to VaultLens for price category
- `source` field indicates actual data source used
- No additional configuration or handling required

**Example:**

```typescript
// Indexer returns price from 20 minutes ago
const { priceUSD, source } = usePrice({ vaultAddress: '0x...' })

// Hook automatically:
// 1. Detects stale timestamp (20min > 15min threshold)
// 2. Treats indexer price as null
// 3. Fetches oracle/unitOfAccount from vault
// 4. Queries on-chain oracle for fresh price
// 5. Returns: priceUSD from oracle, source: "vaultOracle"
```

**Testing Staleness:**

See Storybook story "Stale Price Fallback (>15min)" for interactive demonstration:

```bash
pnpm storybook
# Navigate to: usePrice → Stale Price Fallback (>15min)
```

---

## Hook: `useVaultOraclePrice`

### Purpose
Low-level on-chain price fetch via vault oracle. Used internally by `usePrice`.

The oracle address (fetched from `vault.oracle()`) is used for:
1. Getting asset price in the vault's unit of account
2. Converting unit of account to USD (when UoA is not USD)

### Signature

```typescript
function useVaultOraclePrice({
  assetAddress?: Address,
  oracleAddress: Address,      // Vault's oracle (from vault.oracle())
  unitOfAccount: Address,      // Vault's UoA (from vault.unitOfAccount())
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
  usdUnitOfAccount: Address   // Virtual USD address (e.g., 0x348 = 840 decimal = USD ISO code)
  usdReferenceToken: Address  // Stablecoin for USD conversion (e.g., USDC)
  indexerUrl?: string         // Optional indexer API URL
  vaultLensAddress?: Address  // Optional VaultLens contract address
}
```

> Oracle router addresses are fetched per-vault via `vault.oracle()` - no global router config needed.

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
