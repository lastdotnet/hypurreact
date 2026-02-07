# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

`@hypurr/vaults` is a React hooks library for fetching Euler vault data on HyperEVM. It provides intelligent data source selection between a fast indexer API and on-chain queries (via VaultLens contract), with automatic fallback when the indexer is unavailable or returns stale data.

**Tech Stack:** React 18, TypeScript, wagmi v2, viem v2, TanStack Query v5, Vitest, Storybook

## Development Commands

```bash
# Install dependencies
pnpm install

# Type checking
pnpm typecheck

# Testing
pnpm test              # Run all tests once (CI mode)
pnpm test:watch        # Run tests in watch mode
pnpm test usePrice     # Run specific test file

# Development
pnpm storybook         # Start Storybook on :6006 for interactive development

# Build
pnpm build             # Build library with tsup
```

## Architecture Overview

### Data Source Strategy

The library implements a **dual-source architecture** with intelligent fallback:

1. **Indexer** (fast, cached): REST API returning pre-computed vault data
   - Primary source for: price, identity, financials, apy, caps, collateral, metadata
   - Endpoint: `POST /v2/vault/list?chainId={id}`
   - Caching: 60s default (configurable via `indexerStaleTime`)

2. **VaultLens** (on-chain, authoritative): Smart contract reading vault state
   - Required for: irmConfig, feeConfig, liquidation, hooks, oracle
   - Fallback for indexer categories when indexer fails
   - Called via wagmi's `useReadContract`

3. **Staleness Protection** (15-minute threshold):
   - Indexer prices older than 15 minutes are treated as `null`
   - Triggers automatic on-chain fallback via vault oracle
   - Implemented in `useIndexerPrices.ts` and `useIndexerVaultData.ts`

### Hook Hierarchy

```
useVaultInfo (high-level, multi-category)
├── useIndexerVaultData (indexer source)
│   └── fetch /v2/vault/list
└── useVaultLensData (on-chain source)
    └── wagmi multicall to VaultLens contract

usePrice (single asset price)
├── useIndexerPrices (indexer prices map)
│   └── fetch /v2/vault/list
├── useReadContracts (lazy vault config fetch)
│   └── vault.oracle() + vault.unitOfAccount() + vault.asset()
└── useVaultOraclePrice (on-chain price)
    └── oracle.getQuote()
```

### Category-Based Data Model

Data is organized into **12 categories** that map to either indexer or VaultLens:

| Category | Source | Fallback Available |
|----------|--------|-------------------|
| price, identity, financials, apy, caps, collateral | Indexer | Yes → VaultLens |
| metadata | Indexer | No |
| irmConfig, feeConfig, liquidation, hooks, oracle | VaultLens | No |

**Key Implementation:**
- `INDEXER_CATEGORIES`, `VAULTLENS_ONLY_CATEGORIES`, `OVERLAP_CATEGORIES` constants in `src/types/vaultInfo.ts` define source mapping
- `mergeVaultData()` in `useVaultInfo.ts` implements fallback logic
- `copyFieldsForCategory()` maps category names to specific fields

### Oracle Address Resolution

**Critical: No global oracle router address in config**

Oracle addresses are fetched **per-vault** from `vault.oracle()`:
- Each vault has its own oracle router
- The router handles both asset→UoA and UoA→USD conversions
- `usePrice` lazy-loads oracle config only when indexer lacks price

```typescript
// When indexer price unavailable:
const [oracleAddress, unitOfAccount, assetAddress] = await multicall([
  vault.oracle(),
  vault.unitOfAccount(),
  vault.asset()
])
// Then query: oracle.getQuote(assetAddress, unitOfAccount)
```

### Lazy Loading Strategy

**Performance optimization** in `usePrice`:
1. Check indexer first (fast, no RPC calls)
2. Only if indexer has no price: fetch vault config (oracle/unitOfAccount/asset)
3. Only if vault config succeeds: query on-chain oracle
4. Cache vault config indefinitely (oracle addresses are immutable)

See `shouldFetchVaultConfig` logic in `src/hooks/usePrice.ts:62-67`

## Testing Conventions

- **Framework:** Vitest with React Testing Library
- **Mocking:** All external dependencies (wagmi, context) are mocked via `vi.mock()`
- **Test Structure:** Nested `describe` blocks with descriptive names
- **Timestamps:** Tests use `Date.now()` for realistic staleness checks

**Important Test Patterns:**
```typescript
// Mock indexer with timestamps
const freshTimestamp = new Date(Date.now() - 5 * 60 * 1000).toISOString()
const staleTimestamp = new Date(Date.now() - 16 * 60 * 1000).toISOString()

// Mock wagmi return value (must match exact shape)
vi.mocked(useReadContracts).mockReturnValue({
  data: mockData,
  isLoading: false,
  // ... all required fields from UseQueryResult
} as any)
```

## Storybook Development

Stories are the **primary development tool** for this library. They demonstrate real-world usage with live API calls.

**Key Stories:**
- `src/stories/useVaultInfo.stories.tsx` - Multi-category fetching
- `src/stories/usePrice.stories.tsx` - Price fallback scenarios (including staleness)
- `src/stories/LiveDashboard.stories.tsx` - Real vault dashboard

**Story Structure:**
- Each story is a React component wrapped in required providers
- Uses real HyperEVM chain (chainId: 999) and production indexer URL
- Visual state indicators (loading, error, data source)

## Key Files

### Core Hooks
- `src/hooks/useVaultInfo.ts` - Main hook with source selection logic
- `src/hooks/useEarnVaultInfo.ts` - Earn vault data with strategies
- `src/hooks/usePrice.ts` - Price hook with lazy vault config loading
- `src/hooks/useVaultOraclePrice.ts` - Low-level on-chain price query

### Vault List & Verification Hooks
- `src/hooks/useVaults.ts` - Vault list filtering with verified toggle
- `src/hooks/useEarnVaults.ts` - Earn vault list filtering with verified toggle
- `src/hooks/useVerifiedVaults.ts` - Fetch verified array from governedPerspective
- `src/hooks/useVerifiedEarnVaults.ts` - Fetch verified array from eulerEarnGovernedPerspective

### Data Layer
- `src/hooks/useIndexerVaultData.ts` - Indexer data fetching (with staleness check)
- `src/hooks/useIndexerPrices.ts` - Indexer price map (with staleness check)
- `src/hooks/useVaultLensData.ts` - VaultLens contract queries

### Configuration
- `src/config/createVaultConfig.ts` - Config validation (URL format, required fields)
- `src/context/VaultProvider.tsx` - React context for global config

### Type Definitions
- `src/types/vaultInfo.ts` - All category definitions, constants, type mappings

## Important Architectural Decisions

### Why Staleness Check?

Indexer prices can lag 5+ minutes behind actual data. The 15-minute threshold:
- Ensures users don't see dangerously outdated prices in volatile markets
- Balances freshness vs reliability (avoids excessive on-chain calls for minor delays)
- Implemented at data layer, transparent to consuming hooks

### Why Category-Based Design?

Allows consumers to request exactly what they need:
- Reduces over-fetching (only query needed categories)
- Enables smart source selection (indexer for fast data, on-chain for authoritative)
- Type-safe: returned data type matches requested categories

### Why No Global Oracle Router?

Each vault can use a different oracle configuration:
- Different oracles for different asset types
- Allows per-vault oracle upgrades
- More flexible than hardcoded global router

### APY Data Format

**Critical: Indexer returns APY as percentages, not decimals**

The indexer API returns APY values already formatted as percentages:
- `5.25` means 5.25% APY (NOT 0.0525)
- Do NOT multiply by 100 when displaying

**APY Components (Supply Side):**
| Field | Description | Example |
|-------|-------------|---------|
| `supplyAPY` | Total yield for depositors (base + intrinsic + reward) | 4.16 (4.16%) |
| `baseAPY` | Lending yield from interest rate model | 1.5 (1.5%) |
| `intrinsicAPY` | Staking yield (kHYPE, wstHYPE, beHYPE) | 2.16 (2.16%) |
| `rewardAPY` | Token incentive rewards | 0.5 (0.5%) |

**Borrow Side:**
| Field | Description | Source |
|-------|-------------|--------|
| `borrowAPY` | Interest rate borrowers pay | VaultLens only |

**Implementation:**
- `supplyAPY` uses `totalApy` from indexer (NOT `baseApy`) - this is the sum of all supply-side yields
- `intrinsicAPY` is extracted from nested `intrinsicApy.apy` object
- `borrowAPY` is only available from VaultLens (on-chain), not from indexer
- Staked assets (kHYPE, wstHYPE) have intrinsic yield from underlying staking protocols

## Common Gotchas

1. **Always wrap components in VaultProvider**: Missing context causes "useVaultConfig must be used within VaultProvider" error

2. **Wagmi config must include correct chain**: chainId must match VaultConfig.chainId

3. **Test mocks must include all UseQueryResult fields**: Partial mocks cause TypeScript errors

4. **Staleness is checked per price, not per request**: Single indexer response can have mix of fresh/stale prices

5. **Category presets are readonly tuples**: Use `as const` when defining custom category arrays for type inference

6. **APY values are percentages**: Indexer returns `5.25` for 5.25%, not `0.0525`. Do NOT multiply by 100

## Memory & Performance Notes

- **Query caching**: TanStack Query caches all fetched data (default 5min gc time)
- **Vault config cached indefinitely**: Oracle addresses don't change, safe to cache
- **Indexer stale time**: 60s default, configurable via `indexerStaleTime` config option
- **Parallel queries**: `useVaultInfo` fetches indexer + VaultLens in parallel when both needed

## Breaking Changes (v0.2.0)

`routerAddress` removed from `VaultConfig`. Oracle addresses now fetched per-vault from `vault.oracle()`. See docs/AGENT_INTEGRATION.md for migration guide.
