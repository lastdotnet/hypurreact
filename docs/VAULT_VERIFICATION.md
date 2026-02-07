# Vault Verification Guide

This document describes the vault verification feature that allows filtering vaults by their verification status from Euler's perspective contracts.

---

## Overview

Euler Protocol uses **Perspective contracts** to maintain lists of verified vaults. These contracts provide a `verifiedArray()` function that returns all vault addresses that have passed verification criteria.

The library provides hooks to fetch these verified vault lists and filter vault arrays accordingly:

- **`governedPerspective`** - Verifies regular EVK vaults (Prime, Yield products)
- **`eulerEarnGovernedPerspective`** - Verifies Euler Earn vaults

---

## Configuration

To enable vault verification, add the perspective addresses to your `VaultConfig`:

```typescript
import { createVaultConfig } from '@hypurr/vaults'

const config = createVaultConfig({
  chainId: 999,  // HyperEVM
  usdUnitOfAccount: '0x0000000000000000000000000000000000000348',
  usdReferenceToken: '0xb8ce59fc3717ada4c02eadf9682a9e934f625ebb',
  indexerUrl: 'https://indexer-hyperevm-api-prod.up.railway.app',

  // Perspective addresses for verification
  governedPerspectiveAddress: '0x4936Cd82936b6862fDD66CC8c36e1828127a6b57',
  eulerEarnGovernedPerspectiveAddress: '0x7b27dED9344D9c66FeAF58D151b52d1359aeA807',
})
```

### HyperEVM Addresses (Chain ID: 999)

| Contract | Address |
|----------|---------|
| governedPerspective | `0x4936Cd82936b6862fDD66CC8c36e1828127a6b57` |
| eulerEarnGovernedPerspective | `0x7b27dED9344D9c66FeAF58D151b52d1359aeA807` |

You can find perspective addresses for other chains in:
`lib/euler-interfaces/addresses/{chainId}/PeripheryAddresses.json`

---

## Hooks

### `useVerifiedVaults`

Fetches the verified vault array from the `governedPerspective` contract.

```typescript
import { useVerifiedVaults } from '@hypurr/vaults'

function VerificationStatus() {
  const { data, isLoading, isConfigured, isError } = useVerifiedVaults()

  if (!isConfigured) return <div>Perspective not configured</div>
  if (isLoading) return <div>Loading...</div>
  if (isError) return <div>Error loading verified vaults</div>

  return <div>{data?.length} vaults verified</div>
}
```

**Return Type:**

```typescript
interface UseVerifiedVaultsResult {
  data: readonly Address[] | undefined  // Array of verified vault addresses
  isLoading: boolean
  isError: boolean
  error: Error | null
  isConfigured: boolean  // Whether governedPerspectiveAddress is set
}
```

### `useVerifiedEarnVaults`

Fetches the verified vault array from the `eulerEarnGovernedPerspective` contract.

```typescript
import { useVerifiedEarnVaults } from '@hypurr/vaults'

function EarnVerificationStatus() {
  const { data, isLoading, isConfigured } = useVerifiedEarnVaults()

  if (!isConfigured) return <div>Earn perspective not configured</div>
  if (isLoading) return <div>Loading...</div>

  return <div>{data?.length} earn vaults verified</div>
}
```

### `useVaults`

Filters a list of vault addresses with optional verified-only filtering.

```typescript
import { useVaults } from '@hypurr/vaults'

function VaultList({ allVaults }: { allVaults: Address[] }) {
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(false)

  const { vaults, count, verifiedSet, isLoading, isPerspectiveConfigured } = useVaults({
    vaults: allVaults,
    verified: showVerifiedOnly,
  })

  return (
    <div>
      <label>
        <input
          type="checkbox"
          checked={showVerifiedOnly}
          onChange={e => setShowVerifiedOnly(e.target.checked)}
          disabled={!isPerspectiveConfigured}
        />
        Show verified only ({count} vaults)
      </label>

      <ul>
        {vaults.map(vault => (
          <li key={vault}>
            {vault}
            {verifiedSet.has(vault.toLowerCase()) && <span> ✓</span>}
          </li>
        ))}
      </ul>
    </div>
  )
}
```

**Parameters:**

```typescript
interface UseVaultsParams {
  vaults: readonly Address[]  // Input vault addresses
  verified?: boolean          // When true, filter to verified only (default: false)
}
```

**Return Type:**

```typescript
interface UseVaultsResult {
  vaults: Address[]           // Filtered vault addresses
  count: number               // Count after filtering
  isVerifiedFilter: boolean   // Whether verified filter is active
  isLoading: boolean          // Whether verification data is loading
  isPerspectiveConfigured: boolean  // Whether perspective address is set
  verifiedSet: Set<string>    // Set of verified addresses (lowercase, for badge rendering)
}
```

### `useEarnVaults`

Same as `useVaults`, but for Earn vaults using `eulerEarnGovernedPerspective`.

```typescript
import { useEarnVaults } from '@hypurr/vaults'

function EarnVaultList({ allEarnVaults }: { allEarnVaults: Address[] }) {
  const { vaults, count, verifiedSet } = useEarnVaults({
    vaults: allEarnVaults,
    verified: true,  // Only show verified earn vaults
  })

  return (
    <ul>
      {vaults.map(vault => (
        <li key={vault}>
          {vault}
          {verifiedSet.has(vault.toLowerCase()) && <span> ✓</span>}
        </li>
      ))}
    </ul>
  )
}
```

---

## Caching

The verified vault arrays are cached for **5 minutes** to minimize RPC calls while keeping data reasonably fresh.

```typescript
// Internal cache configuration
const VERIFIED_CACHE_TIME = 5 * 60 * 1000  // 5 minutes

// Cache is shared across all components using these hooks
// via TanStack Query's cache
```

---

## Common Patterns

### Show Verified Badge

```tsx
function VaultCard({ vaultAddress }: { vaultAddress: Address }) {
  const { verifiedSet } = useVaults({
    vaults: [vaultAddress],
    verified: false,  // Don't filter, just get the set
  })

  const isVerified = verifiedSet.has(vaultAddress.toLowerCase())

  return (
    <div>
      <h3>
        {vaultName}
        {isVerified && <span className="badge">Verified</span>}
      </h3>
    </div>
  )
}
```

### Toggle Filter with Loading State

```tsx
function FilterableVaultList({ vaults }: { vaults: Address[] }) {
  const [showVerified, setShowVerified] = useState(false)

  const { vaults: filteredVaults, isLoading, count } = useVaults({
    vaults,
    verified: showVerified,
  })

  return (
    <div>
      <button onClick={() => setShowVerified(!showVerified)}>
        {showVerified ? 'Show All' : 'Show Verified Only'}
        {isLoading && ' (loading...)'}
      </button>
      <p>Showing {count} of {vaults.length} vaults</p>
      {/* render filteredVaults */}
    </div>
  )
}
```

### Separate Verified Status from Filtering

```tsx
function Dashboard({ allVaults, allEarnVaults }: Props) {
  // Get verification status without filtering
  const { verifiedSet: regularVerified } = useVaults({ vaults: allVaults })
  const { verifiedSet: earnVerified } = useEarnVaults({ vaults: allEarnVaults })

  // Use sets for O(1) lookup when rendering
  const isVerified = (address: Address, isEarn: boolean) => {
    const set = isEarn ? earnVerified : regularVerified
    return set.has(address.toLowerCase())
  }

  return (
    <div>
      {allVaults.map(v => (
        <VaultCard key={v} address={v} verified={isVerified(v, false)} />
      ))}
    </div>
  )
}
```

---

## Storybook Examples

Interactive examples are available in Storybook:

```bash
pnpm storybook
```

| Story | Demonstrates |
|-------|--------------|
| `useVaults / Verified Filter Demo` | Toggle between all and verified vaults |
| `useEarnVaults / Verified Filter Demo` | Same for Earn vaults |
| `Examples / Live Dashboard` | Full dashboard with verification badges |

---

## Contract Interface

The hooks use the `basePerspectiveAbi` to call the following function:

```solidity
interface IBasePerspective {
    function verifiedArray() external view returns (address[] memory);
    function isVerified(address vault) external view returns (bool);
    function verifiedLength() external view returns (uint256);
}
```

The library uses `verifiedArray()` to fetch all verified addresses in a single call, which is more efficient than checking `isVerified()` for each vault individually.

---

## Error Handling

```typescript
const { data, isError, error, isConfigured } = useVerifiedVaults()

// Not configured - perspective address missing from config
if (!isConfigured) {
  // Show warning or hide verification features
}

// Error - contract call failed
if (isError) {
  console.error('Failed to fetch verified vaults:', error)
  // Fall back to showing all vaults unfiltered
}

// Success - data is available
if (data) {
  // Use verified vault list
}
```

---

## TypeScript

All hooks are fully typed. The `verified` parameter controls the filter behavior:

```typescript
// When verified is false (default), returns all input vaults
const { vaults } = useVaults({ vaults: allVaults })
// vaults: Address[] - same as input

// When verified is true, filters to only verified vaults
const { vaults } = useVaults({ vaults: allVaults, verified: true })
// vaults: Address[] - subset of input that are verified
```
