# @hypurr/vaults

React hooks for Euler vault data on HyperEVM. Built on [wagmi](https://wagmi.sh/) and [TanStack Query](https://tanstack.com/query).

> **Note:** Oracle addresses are fetched automatically from each vault - no `routerAddress` needed in config.

## Core Hook: `useVaultInfo`

Fetches vault data with **intelligent source selection**:

```typescript
const { data, source } = useVaultInfo({
  vaultAddress: '0x...',
  options: { include: ['price', 'financials', 'apy'] }
})
```

### How Data Source Selection Works

Categories are mapped to optimal sources:

| Source | Categories | When Used |
|--------|------------|-----------|
| **Indexer** (fast) | price, identity, financials, apy, caps, collateral, metadata | Primary source |
| **VaultLens** (on-chain) | irmConfig, feeConfig, liquidation, hooks, oracle | On-chain only data |

The hook automatically:
- Uses indexer as primary source (faster, cheaper)
- Falls back to VaultLens if indexer fails
- Queries both sources in parallel when needed
- Returns `source` metadata showing which source provided which data

Force on-chain with `forceOnchain: true`.

### Category Presets

```typescript
import { CATEGORY_PRESETS } from '@hypurr/vaults'

CATEGORY_PRESETS.card       // ['identity', 'price', 'apy']
CATEGORY_PRESETS.dashboard  // ['identity', 'price', 'financials', 'apy', 'caps']
CATEGORY_PRESETS.full       // + collateral, metadata
```

## Installation

```bash
pnpm add @hypurr/vaults
```

Requires: `react@^18`, `@tanstack/react-query@>=5`, `wagmi@^2`, `viem@^2`

## Quick Start

```typescript
import { VaultProvider, createVaultConfig, useVaultInfo } from '@hypurr/vaults'

const config = createVaultConfig({
  chainId: 999,
  usdUnitOfAccount: '0x0000000000000000000000000000000000000348',
  usdReferenceToken: '0xb8ce59fc3717ada4c02eadf9682a9e934f625ebb',
})
// Oracle addresses are fetched automatically from each vault

// Wrap app
<VaultProvider config={config}>
  <App />
</VaultProvider>

// Use in components
function VaultCard({ address }) {
  const { data, isLoading, source } = useVaultInfo({
    vaultAddress: address,
    options: { include: CATEGORY_PRESETS.card }
  })
  // data.assetPrice, data.supplyAPY, etc.
}
```

## Examples & Playbook

**Interactive examples**: Run Storybook to see all hooks in action:

```bash
pnpm storybook
```

Stories demonstrate:
- Price fetching (indexer vs on-chain)
- Dashboard preset usage
- Hybrid fetching (indexer + VaultLens)
- Forcing on-chain queries

See `src/stories/` for code examples.

## API Reference

For full API details including `usePrice`, `useVaultOraclePrice`, and type definitions, see [docs/AGENT_INTEGRATION.md](./docs/AGENT_INTEGRATION.md).

## License

MIT
