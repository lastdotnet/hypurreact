# @hypurr/vaults

[![npm version](https://img.shields.io/npm/v/@hypurr/vaults.svg)](https://www.npmjs.com/package/@hypurr/vaults)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Build Status](https://img.shields.io/github/actions/workflow/status/marsfoundation/hypurr-lending-interface/ci.yml)](https://github.com/marsfoundation/hypurr-lending-interface)

React hooks for Euler vault data on HyperEVM. Built on top of [wagmi](https://wagmi.sh/) and [TanStack Query](https://tanstack.com/query/latest).

## Features

- 🪝 **React Hooks** - `useVaultInfo`, `usePrice`, `useIndexerPrices`, and more
- 🔄 **Dual Data Sources** - Indexer-first with VaultLens on-chain fallback
- 📊 **Category-Based Fetching** - Request only the vault data you need
- ⚡ **Query Optimization** - Built-in prefetching and caching with TanStack Query
- 🎯 **Type-Safe** - Full TypeScript support with comprehensive type definitions
- 🔌 **Wagmi Integration** - Works seamlessly with wagmi and viem

## Installation

### Using pnpm (recommended)

```bash
pnpm add @hypurr/vaults
```

### Using npm

```bash
npm install @hypurr/vaults
```

### Using yarn

```bash
yarn add @hypurr/vaults
```

### Peer Dependencies

Make sure you have the following peer dependencies installed:

```bash
pnpm add react@^18 @tanstack/react-query@>=5.0.0 wagmi@^2.0.0 viem@^2.0.0
```

**Minimum versions:**
- `react` ^18.0.0
- `@tanstack/react-query` >=5.0.0
- `wagmi` ^2.0.0
- `viem` ^2.0.0

## Quick Start

### 1. Create Vault Configuration

First, create your vault configuration with the Euler HyperEVM settings:

```typescript
import { createVaultConfig } from '@hypurr/vaults'

// Euler HyperEVM configuration
const vaultConfig = createVaultConfig({
  chainId: 999,
  routerAddress: '0x28675f23E149c25f4f672FAD05f4e71DAfb75048',
  usdUnitOfAccount: '0x0000000000000000000000000000000000000348',
  usdReferenceToken: '0xb8ce59fc3717ada4c02eadf9682a9e934f625ebb',
})
```

### 2. Wrap Your App with VaultProvider

```typescript
import { VaultProvider } from '@hypurr/vaults'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { config as wagmiConfig } from './wagmi.config'
import { vaultConfig } from './oracle.config'

const queryClient = new QueryClient()

export function App() {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <VaultProvider config={vaultConfig}>
          <YourApp />
        </VaultProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
```

### 3. Use the usePrice Hook

```typescript
import { usePrice } from '@hypurr/vaults'

export function PriceDisplay() {
  const { priceUSD, isLoading, error } = usePrice({
    assetAddress: '0xb8ce59fc3717ada4c02eadf9682a9e934f625ebb',
    vaultAddress: '0x...',
  })

  if (isLoading) return <div>Loading price...</div>
  if (error) return <div>Error: {error.message}</div>

  return <div>Price: ${priceUSD.toFixed(2)}</div>
}
```

## Usage Examples

### Using usePrice with Vault Address (Auto-Fetch Oracle)

Fetch price data by providing a vault address. The hook automatically fetches the oracle and unit of account from the vault:

```typescript
import { usePrice } from '@hypurr/vaults'

export function VaultAssetPrice({ vaultAddress, assetAddress }) {
  const { priceUSD, isLoading, isError, error, source } = usePrice({
    assetAddress,
    vaultAddress, // Oracle and unitOfAccount will be auto-fetched
  })

  if (isLoading) return <p>Fetching price...</p>
  if (isError) return <p>Failed to fetch price: {error?.message}</p>

  return (
    <div>
      <p>Price: ${priceUSD.toFixed(2)}</p>
      <small>Source: {source}</small>
    </div>
  )
}
```

### Using usePrice with Indexer Data (Primary Source)

Provide indexer price data for faster response with automatic fallback to on-chain oracle:

```typescript
import { usePrice } from '@hypurr/vaults'

export function TokenPriceWithIndexer({ assetAddress, vaultAddress, indexerPrice }) {
  const { priceUSD, isLoading, isError, source } = usePrice({
    assetAddress,
    vaultAddress,
    indexerPrice, // If provided and valid, used immediately (primary source)
  })

  return (
    <div>
      {isLoading && <p>Fetching price...</p>}
      {isError && <p>Failed to fetch price</p>}
      {priceUSD > 0 && (
        <div>
          <p>Price: ${priceUSD.toFixed(4)}</p>
          <small>Source: {source === 'indexer' ? 'Indexer' : 'On-Chain Oracle'}</small>
        </div>
      )}
    </div>
  )
}
```

### Using usePrice with Explicit Oracle Address

Skip vault config fetching by providing oracle and unit of account directly:

```typescript
import { usePrice } from '@hypurr/vaults'

export function DirectOraclePrice({ assetAddress, oracleAddress, unitOfAccount }) {
  const { priceUSD, isLoading, source } = usePrice({
    assetAddress,
    oracleAddress,
    unitOfAccount,
    // No vault config fetch needed - oracle/unitOfAccount provided directly
  })

  return (
    <div>
      <span>${priceUSD.toFixed(2)}</span>
      <small>({source})</small>
    </div>
  )
}
```

### Using usePriceQueryOptions for Prefetching

Prefetch price data before rendering components to improve UX:

```typescript
import { usePriceQueryOptions } from '@hypurr/vaults'
import { useQueryClient } from '@tanstack/react-query'

export function PrefetchButton({ assetAddress, vaultAddress }) {
  const queryClient = useQueryClient()
  const queryOptions = usePriceQueryOptions({
    assetAddress,
    vaultAddress,
    indexerPrice: 1.0, // Pre-fetched from indexer API
  })

  const handlePrefetch = () => {
    queryClient.prefetchQuery(queryOptions)
  }

  return <button onClick={handlePrefetch}>Load Price</button>
}
```

### Per-Hook Configuration Override

Override global config for specific hooks:

```typescript
import { usePrice } from '@hypurr/vaults'

export function CustomPrice({ assetAddress, vaultAddress }) {
  const { priceUSD } = usePrice(
    {
      assetAddress,
      vaultAddress,
    },
    {
      // Override global config for this hook
      chainId: 999, // Override chain ID
    }
  )

  return <div>Price: ${priceUSD.toFixed(2)}</div>
}
```

## API Reference

### Components

#### VaultProvider

Context provider that wraps your application with vault configuration. Must wrap any components that use vault hooks.

**Props:**
- `config` (VaultConfig) - **Required.** Vault configuration object
- `children` (ReactNode) - Child components that will have access to the vault context

**Example:**
```typescript
import { VaultProvider, createVaultConfig } from '@hypurr/vaults'

const vaultConfig = createVaultConfig({
  chainId: 999,
  routerAddress: '0x28675f23E149c25f4f672FAD05f4e71DAfb75048',
  usdUnitOfAccount: '0x0000000000000000000000000000000000000348',
  usdReferenceToken: '0xb8ce59fc3717ada4c02eadf9682a9e934f625ebb',
})

export function App() {
  return (
    <VaultProvider config={vaultConfig}>
      <YourApp />
    </VaultProvider>
  )
}
```

### Hooks

#### usePrice

Unified hook to get asset price in USD using vault-specific oracles. Automatically handles oracle and unit of account retrieval from vault if not explicitly provided.

**Parameters:**
- `params` (UsePriceParams) - Configuration for the price query
  - `assetAddress?` (Address) - The asset address to get price for
  - `vaultAddress?` (Address) - The vault address to fetch oracle/unitOfAccount from (if not explicitly provided)
  - `oracleAddress?` (Address) - The vault's oracle address (optional - if not provided and vaultAddress is given, will be fetched)
  - `unitOfAccount?` (Address) - The vault's unit of account address (optional - if not provided and vaultAddress is given, will be fetched)
  - `chainId?` (number) - Chain ID (optional, uses context if not provided)
  - `enabled?` (boolean) - Whether the query is enabled (default: true)
  - `indexerPrice?` (number | null) - Price from indexer API (used as primary source, on-chain as fallback)
  - `config?` (VaultConfig) - Optional config override (uses context if not provided)

**Returns:**
- `priceUSD` (number) - Asset price in USD
- `isLoading` (boolean) - Loading state
- `isError` (boolean) - Error state
- `error` (Error | null) - Error object if query failed
- `source` ('vaultOracle' | 'indexer' | 'none') - Data source used

**Example:**
```typescript
const { priceUSD, isLoading, isError, error, source } = usePrice({
  assetAddress: '0xb8ce59fc3717ada4c02eadf9682a9e934f625ebb',
  vaultAddress: '0x...',
  indexerPrice: 1.0,
})
```

#### useVaultOraclePrice

Low-level hook to get asset price in USD via vault's oracle. Supports dual-source approach where indexer prices take priority over on-chain queries.

**Parameters:**
- `params` (UseVaultOraclePriceParams) - Configuration for the price query
  - `assetAddress?` (Address) - The asset address to get price for
  - `oracleAddress?` (Address) - The vault's oracle address
  - `unitOfAccount?` (Address) - The vault's unit of account address
  - `chainId?` (number) - Chain ID (optional, uses context if not provided)
  - `enabled?` (boolean) - Whether the query is enabled (default: true)
  - `indexerPrice?` (number | null) - Price from indexer API (used as primary source)
  - `config?` (VaultConfig) - Optional config override (uses context if not provided)

**Returns:**
- `priceUSD` (number) - Asset price in USD
- `isLoading` (boolean) - Loading state
- `isError` (boolean) - Error state
- `error` (Error | null) - Error object if query failed
- `priceInUoA?` (bigint) - Price in unit of account (raw bigint)
- `uoaToUSD?` (bigint) - Unit of account to USD price (raw bigint)
- `source` ('indexer' | 'onchain' | 'none') - Data source used

**Example:**
```typescript
const { priceUSD, isLoading, source } = useVaultOraclePrice({
  assetAddress: '0xb8ce59fc3717ada4c02eadf9682a9e934f625ebb',
  oracleAddress: '0x...',
  unitOfAccount: '0x...',
  indexerPrice: 1.0,
})
```

#### usePriceQueryOptions

Get TanStack Query options for price queries. Useful for prefetching or custom query setup.

**Parameters:**
- `params` (UsePriceParams) - Configuration for the price query
  - `assetAddress?` (Address) - The asset address to get price for
  - `vaultAddress?` (Address) - The vault address (used in query key)
  - `oracleAddress?` (Address) - The oracle address (used in query key)
  - `chainId?` (number) - Chain ID for the query key (defaults to 1)
  - `enabled?` (boolean) - Whether the query is enabled (default: true)
  - `indexerPrice?` (number | null) - Price from indexer API (primary data source)

**Returns:**
- Query options compatible with `useQuery` and `prefetchQuery`

**Example:**
```typescript
import { usePriceQueryOptions } from '@hypurr/vaults'
import { useQueryClient } from '@tanstack/react-query'

const queryClient = useQueryClient()
const queryOptions = usePriceQueryOptions({
  assetAddress: '0xb8ce59fc3717ada4c02eadf9682a9e934f625ebb',
  vaultAddress: '0x...',
  indexerPrice: 1.0,
})

// Prefetch the query
await queryClient.prefetchQuery(queryOptions)
```

### Types

#### VaultConfig

Global configuration for the vault system. Required for VaultProvider.

```typescript
interface VaultConfig {
  /**
   * The chain ID where the oracle contracts are deployed.
   * Used to ensure queries target the correct network.
   */
  chainId: number

  /**
   * Address of the Euler Oracle Router contract.
   * This is the main entry point for price queries.
   */
  routerAddress: Address

  /**
   * Unit of account for USD-denominated prices.
   * Typically a virtual address representing USD (e.g., 0x348 for 840 decimal = USD ISO code).
   */
  usdUnitOfAccount: Address

  /**
   * Address of the reference token for USD pricing.
   * Usually a stablecoin like USDC used as the base for USD conversions.
   */
  usdReferenceToken: Address
}
```

**Example:**
```typescript
const config: VaultConfig = {
  chainId: 999,
  routerAddress: '0x28675f23E149c25f4f672FAD05f4e71DAfb75048',
  usdUnitOfAccount: '0x0000000000000000000000000000000000000348',
  usdReferenceToken: '0xb8ce59fc3717ada4c02eadf9682a9e934f625ebb',
}
```

#### UsePriceParams

Configuration options for the usePrice hook.

```typescript
interface UsePriceParams {
  assetAddress?: Address
  vaultAddress?: Address
  oracleAddress?: Address
  unitOfAccount?: Address
  chainId?: number
  enabled?: boolean
  indexerPrice?: number | null
  config?: VaultConfig
}
```

#### UsePriceResult

Result returned by the usePrice hook.

```typescript
interface UsePriceResult {
  priceUSD: number
  isLoading: boolean
  isError: boolean
  error: Error | null
  source: 'vaultOracle' | 'indexer' | 'none'
}
```

#### UseVaultOraclePriceParams

Configuration options for the useVaultOraclePrice hook.

```typescript
interface UseVaultOraclePriceParams {
  assetAddress?: Address
  oracleAddress?: Address
  unitOfAccount?: Address
  chainId?: number
  enabled?: boolean
  indexerPrice?: number | null
  config?: VaultConfig
}
```

#### UseVaultOraclePriceResult

Result returned by the useVaultOraclePrice hook.

```typescript
interface UseVaultOraclePriceResult {
  priceUSD: number
  isLoading: boolean
  isError: boolean
  error: Error | null
  priceInUoA?: bigint
  uoaToUSD?: bigint
  source: 'indexer' | 'onchain' | 'none'
}
```

### Utility Functions

#### createVaultConfig

Factory function to create and validate an VaultConfig object.

**Parameters:**
- `config` (VaultConfig) - Configuration object with all required fields

**Returns:**
- (VaultConfig) - Validated configuration object

**Throws:**
- Error if any required field is missing or invalid

**Example:**
```typescript
import { createVaultConfig } from '@hypurr/vaults'

const config = createVaultConfig({
  chainId: 999,
  routerAddress: '0x28675f23E149c25f4f672FAD05f4e71DAfb75048',
  usdUnitOfAccount: '0x0000000000000000000000000000000000000348',
  usdReferenceToken: '0xb8ce59fc3717ada4c02eadf9682a9e934f625ebb',
})
```

## Migration Guide

### From Inline useEulerPrice to @hypurr/vaults

If you're migrating from using inline `useEulerPrice` hooks in your app to the centralized `@hypurr/vaults` package:

#### Step 1: Install the Package

```bash
pnpm add @hypurr/vaults
```

#### Step 2: Update Imports

**Before:**
```typescript
import { useEulerPrice } from '@/domain/euler/oracle/useEulerPrice'
```

**After:**
```typescript
import { usePrice, useVaultOraclePrice } from '@hypurr/vaults'
```

#### Step 3: Set Up VaultProvider

Wrap your app with the VaultProvider at the root level:

**Before:**
```typescript
// No provider needed - config was passed to each hook
```

**After:**
```typescript
import { VaultProvider, createVaultConfig } from '@hypurr/vaults'

const vaultConfig = createVaultConfig({
  chainId: 999,
  routerAddress: '0x28675f23E149c25f4f672FAD05f4e71DAfb75048',
  usdUnitOfAccount: '0x0000000000000000000000000000000000000348',
  usdReferenceToken: '0xb8ce59fc3717ada4c02eadf9682a9e934f625ebb',
})

export function App() {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <VaultProvider config={vaultConfig}>
          <YourApp />
        </VaultProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
```

#### Step 4: Update Hook Usage

**Before (with inline config):**
```typescript
const { priceUSD } = useEulerPrice({
  assetAddress: '0x...',
  vaultAddress: '0x...',
  indexerPrice: 1.0,
  routerAddress: '0x28675f23E149c25f4f672FAD05f4e71DAfb75048',
  usdUnitOfAccount: '0x0000000000000000000000000000000000000348',
  usdReferenceToken: '0xb8ce59fc3717ada4c02eadf9682a9e934f625ebb',
})
```

**After (using VaultProvider context):**
```typescript
const { priceUSD } = usePrice({
  assetAddress: '0x...',
  vaultAddress: '0x...',
  indexerPrice: 1.0,
  // Config is now provided by VaultProvider context
})
```

#### Step 5: Update Parameter Names

The new API uses more descriptive parameter names:

| Old Parameter | New Parameter | Notes |
|---|---|---|
| `token` | `assetAddress` | More explicit about what the address represents |
| `fallbackPrice` | `indexerPrice` | Clarifies that this is the primary source, not a fallback |
| N/A | `vaultAddress` | New: automatically fetches oracle and unitOfAccount |
| N/A | `oracleAddress` | New: explicit oracle address (alternative to vaultAddress) |
| N/A | `unitOfAccount` | New: explicit unit of account (alternative to vaultAddress) |

#### Step 6: Handle Return Value Changes

**Before:**
```typescript
const { priceUSD, isLoading, error } = useEulerPrice(...)
```

**After:**
```typescript
const { priceUSD, isLoading, isError, error, source } = usePrice(...)
// Note: isError is now a boolean (was implicit in error !== null)
// source indicates where the price came from: 'indexer', 'vaultOracle', or 'none'
```

#### Complete Migration Example

**Before:**
```typescript
import { useEulerPrice } from '@/domain/euler/oracle/useEulerPrice'

export function TokenPrice({ assetAddress, vaultAddress, indexerPrice }) {
  const { priceUSD, isLoading, error } = useEulerPrice({
    assetAddress,
    vaultAddress,
    indexerPrice,
    routerAddress: '0x28675f23E149c25f4f672FAD05f4e71DAfb75048',
    usdUnitOfAccount: '0x0000000000000000000000000000000000000348',
    usdReferenceToken: '0xb8ce59fc3717ada4c02eadf9682a9e934f625ebb',
  })

  if (isLoading) return <span>Loading...</span>
  if (error) return <span>Error</span>
  return <span>${priceUSD.toFixed(2)}</span>
}
```

**After:**
```typescript
import { usePrice } from '@hypurr/vaults'

export function TokenPrice({ assetAddress, vaultAddress, indexerPrice }) {
  const { priceUSD, isLoading, isError, error } = usePrice({
    assetAddress,
    vaultAddress,
    indexerPrice,
    // Config is now provided by VaultProvider context
  })

  if (isLoading) return <span>Loading...</span>
  if (isError) return <span>Error: {error?.message}</span>
  return <span>${priceUSD.toFixed(2)}</span>
}
```

## Best Practices

1. **Wrap your app with VaultProvider** - Ensure all components that use vault hooks are wrapped with the provider
2. **Use TanStack Query for caching** - Leverage built-in caching to reduce redundant queries
3. **Handle loading and error states** - Always check `isLoading` and `error` before rendering data
4. **Prefetch when possible** - Use `usePriceQueryOptions` to prefetch data before rendering
5. **Override config sparingly** - Use per-hook config overrides only when necessary

## Examples

For more examples and use cases, check out the [examples](./examples) directory.

## Contributing

Contributions are welcome! Please read our [contributing guidelines](../../CONTRIBUTING.md) before submitting PRs.

## License

MIT © [Mars SPC Limited](https://marsfoundation.io)
