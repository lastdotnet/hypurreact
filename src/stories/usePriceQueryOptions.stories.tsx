import type { Meta, StoryObj } from '@storybook/react'
import * as React from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { usePriceQueryOptions } from '../hooks/usePriceQueryOptions'
import { usePrice } from '../hooks/usePrice'
import type { Address } from 'viem'

// Real vault addresses on HyperEVM with their asset symbols
const VAULTS = {
  'WHYPE Prime': {
    address: '0xF73c654d468f5485bF15F3470B78851a49257704' as Address,
    symbol: 'WHYPE',
    description: 'Wrapped HYPE token',
  },
  'kHYPE Prime': {
    address: '0x443100d1149D6d925Edb044248BBE32c5C7Ae955' as Address,
    symbol: 'kHYPE',
    description: 'Kinto staked HYPE',
  },
  'WHYPE Yield': {
    address: '0xc7e7861352df6919e7152C007832C48A777f2a4c' as Address,
    symbol: 'WHYPE',
    description: 'WHYPE Yield vault',
  },
  'kHYPE Yield': {
    address: '0x97d30B40048bA3fC6b6628cE5E02E77f35B64fE0' as Address,
    symbol: 'kHYPE',
    description: 'kHYPE Yield vault',
  },
  'USDC Yield': {
    address: '0xF9BB65e113418292d1a3555515fBd64637a0BE18' as Address,
    symbol: 'USDC',
    description: 'Stablecoin (~$1.00)',
  },
}

type VaultKey = keyof typeof VAULTS

const colors = {
  panel: 'rgb(38, 38, 44)',
  muted: 'rgb(48, 48, 55)',
  foreground: 'rgb(250, 250, 252)',
  mutedForeground: 'rgb(145, 145, 160)',
  primary: 'rgb(142, 231, 194)',
  border: 'rgba(250, 250, 252, 0.05)',
}

interface UsePriceQueryOptionsDemoProps {
  selectedVault: VaultKey
  enabled: boolean
}

function UsePriceQueryOptionsDemo({ selectedVault, enabled }: UsePriceQueryOptionsDemoProps) {
  const vault = VAULTS[selectedVault]
  const queryClient = useQueryClient()
  const [prefetchStatus, setPrefetchStatus] = React.useState<'idle' | 'loading' | 'done'>('idle')
  const [cacheData, setCacheData] = React.useState<unknown>(null)

  const queryOptions = usePriceQueryOptions({
    vaultAddress: vault.address,
    enabled,
  })

  // Also show live price for comparison
  const { priceUSD, isLoading: priceLoading, source } = usePrice({
    vaultAddress: vault.address,
    enabled,
  })

  const handlePrefetch = async () => {
    setPrefetchStatus('loading')
    try {
      await queryClient.prefetchQuery(queryOptions)
      setPrefetchStatus('done')
      setCacheData(queryClient.getQueryData(queryOptions.queryKey))
    } catch {
      setPrefetchStatus('idle')
    }
  }

  const handleInvalidate = () => {
    queryClient.invalidateQueries({ queryKey: queryOptions.queryKey })
    setCacheData(null)
    setPrefetchStatus('idle')
  }

  const handleCheckCache = () => {
    setCacheData(queryClient.getQueryData(queryOptions.queryKey))
  }

  return (
    <div style={{ maxWidth: 650 }}>
      <h3 style={{ margin: '0 0 1rem', color: colors.foreground }}>usePriceQueryOptions Hook Demo</h3>

      {/* Selected Asset Info */}
      <div
        style={{
          background: colors.muted,
          padding: '1rem',
          borderRadius: 8,
          border: `1px solid ${colors.border}`,
          marginBottom: '1rem',
        }}
      >
        <h4 style={{ margin: '0 0 0.75rem', fontSize: 14, color: colors.mutedForeground }}>
          Selected Vault
        </h4>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              background: colors.panel,
              borderRadius: 8,
              padding: '0.5rem 1rem',
              minWidth: 80,
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 20, fontWeight: 700, color: colors.primary }}>{vault.symbol}</div>
          </div>
          <div>
            <div style={{ fontWeight: 600, color: colors.foreground }}>{selectedVault}</div>
            <div style={{ fontSize: 12, color: colors.mutedForeground }}>{vault.description}</div>
            <div
              style={{
                fontSize: 11,
                fontFamily: "'DM Mono', monospace",
                color: colors.mutedForeground,
                marginTop: 4,
              }}
            >
              {vault.address.slice(0, 10)}...{vault.address.slice(-8)}
            </div>
          </div>
        </div>
      </div>

      {/* Live Price Display */}
      <div
        style={{
          background: 'rgba(142, 231, 194, 0.1)',
          border: '1px solid rgba(142, 231, 194, 0.2)',
          borderRadius: 8,
          padding: '1rem',
          marginBottom: '1rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 12, color: colors.mutedForeground, marginBottom: 4 }}>
              Live {vault.symbol} Price
            </div>
            <div
              style={{
                fontSize: 24,
                fontWeight: 700,
                fontFamily: "'DM Mono', monospace",
                color: colors.foreground,
              }}
            >
              {priceLoading ? '...' : `$${priceUSD.toFixed(4)}`}
            </div>
          </div>
          <div
            style={{
              background: 'linear-gradient(135deg, #fbe572 0%, #c2f4bc 100%)',
              padding: 1,
              borderRadius: 7,
            }}
          >
            <div
              style={{
                background: 'rgb(15, 15, 17)',
                borderRadius: 6,
                padding: '4px 10px',
                fontSize: 12,
                fontWeight: 500,
                color: colors.mutedForeground,
              }}
            >
              Source: {source}
            </div>
          </div>
        </div>
      </div>

      {/* Query Key Display */}
      <div
        style={{
          background: colors.panel,
          padding: '1rem',
          borderRadius: 8,
          marginBottom: '1rem',
          border: `1px solid ${colors.border}`,
        }}
      >
        <h4 style={{ margin: '0 0 0.5rem', fontSize: 14, color: colors.mutedForeground }}>Query Key</h4>
        <pre
          style={{
            margin: 0,
            fontSize: 11,
            overflow: 'auto',
            wordBreak: 'break-all',
            color: colors.mutedForeground,
            fontFamily: "'DM Mono', monospace",
          }}
        >
          {JSON.stringify(queryOptions.queryKey, null, 2)}
        </pre>
      </div>

      {/* Cache Controls */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <button
          type="button"
          onClick={handlePrefetch}
          disabled={prefetchStatus === 'loading'}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: 8,
            border: 'none',
            background: colors.primary,
            color: 'rgb(28, 28, 35)',
            fontWeight: 600,
            cursor: prefetchStatus === 'loading' ? 'wait' : 'pointer',
            opacity: prefetchStatus === 'loading' ? 0.7 : 1,
          }}
        >
          {prefetchStatus === 'loading' ? 'Prefetching...' : 'Prefetch Query'}
        </button>

        <button
          type="button"
          onClick={handleCheckCache}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: 8,
            border: '1px solid rgba(250, 250, 252, 0.1)',
            background: 'rgba(255, 255, 255, 0.03)',
            color: colors.mutedForeground,
            cursor: 'pointer',
          }}
        >
          Check Cache
        </button>

        <button
          type="button"
          onClick={handleInvalidate}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: 8,
            border: '1px solid rgba(180, 70, 70, 0.5)',
            background: 'transparent',
            color: 'rgb(180, 70, 70)',
            cursor: 'pointer',
          }}
        >
          Invalidate
        </button>
      </div>

      {/* Cache Status */}
      <div
        style={{
          background: prefetchStatus === 'done' ? 'rgba(142, 231, 194, 0.15)' : colors.muted,
          padding: '1rem',
          borderRadius: 8,
          border: `1px solid ${prefetchStatus === 'done' ? 'rgba(142, 231, 194, 0.3)' : colors.border}`,
        }}
      >
        <h4
          style={{
            margin: '0 0 0.5rem',
            fontSize: 14,
            color: prefetchStatus === 'done' ? colors.primary : colors.mutedForeground,
          }}
        >
          Cache Status: {prefetchStatus === 'done' ? 'Cached ✓' : 'Not cached'}
        </h4>
        {cacheData !== null && (
          <pre
            style={{
              margin: 0,
              fontSize: 12,
              overflow: 'auto',
              background: colors.panel,
              padding: '0.75rem',
              borderRadius: 6,
              color: colors.mutedForeground,
              fontFamily: "'DM Mono', monospace",
            }}
          >
            {JSON.stringify(cacheData, null, 2)}
          </pre>
        )}
        {cacheData === null && (
          <p style={{ margin: 0, color: colors.mutedForeground, fontSize: 12 }}>
            Click "Prefetch Query" to populate the cache, then "Check Cache" to see the data.
          </p>
        )}
      </div>

      {/* Usage Tips */}
      <div
        style={{
          marginTop: '1rem',
          padding: '1rem',
          background: 'rgba(255, 152, 0, 0.1)',
          borderRadius: 8,
          border: '1px solid rgba(255, 152, 0, 0.2)',
          fontSize: 13,
          color: colors.foreground,
        }}
      >
        <strong style={{ color: 'rgb(255, 180, 50)' }}>Usage Tips:</strong>
        <ul style={{ margin: '0.5rem 0 0', paddingLeft: '1.25rem', color: colors.mutedForeground }}>
          <li>
            Use{' '}
            <code
              style={{
                background: colors.panel,
                padding: '0.125rem 0.375rem',
                borderRadius: 4,
                fontFamily: "'DM Mono', monospace",
              }}
            >
              prefetchQuery
            </code>{' '}
            to preload data before navigation
          </li>
          <li>Query keys are stable and can be used for cache invalidation</li>
          <li>
            Combine with{' '}
            <code
              style={{
                background: colors.panel,
                padding: '0.125rem 0.375rem',
                borderRadius: 4,
                fontFamily: "'DM Mono', monospace",
              }}
            >
              usePrice
            </code>{' '}
            for automatic cache hits
          </li>
        </ul>
      </div>
    </div>
  )
}

const meta: Meta<typeof UsePriceQueryOptionsDemo> = {
  title: 'Hooks/usePriceQueryOptions',
  component: UsePriceQueryOptionsDemo,
  parameters: {
    docs: {
      description: {
        component: `
Returns TanStack Query options for price queries. Useful for prefetching
or custom query setup.

**Key Use Cases:**
- Prefetch price data before rendering components
- Share query keys between components
- Manual cache management and invalidation
- Integration with TanStack Query's advanced features

**Example:**
\`\`\`tsx
const queryClient = useQueryClient()
const queryOptions = usePriceQueryOptions({
  vaultAddress: '0x...',
})

// Prefetch the query
await queryClient.prefetchQuery(queryOptions)

// Later, usePrice will hit the cache
const { priceUSD } = usePrice({ vaultAddress: '0x...' })
\`\`\`
        `,
      },
    },
  },
  argTypes: {
    selectedVault: {
      control: 'select',
      options: Object.keys(VAULTS),
      description: 'Select a vault to fetch price for',
    },
    enabled: {
      control: 'boolean',
      description: 'Whether the query is enabled',
    },
  },
}

export default meta
type Story = StoryObj<typeof UsePriceQueryOptionsDemo>

export const Default: Story = {
  name: 'WHYPE Price (Interactive)',
  args: {
    selectedVault: 'WHYPE Prime',
    enabled: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates price query options with WHYPE (Wrapped HYPE). HYPE trades around $20-30.',
      },
    },
  },
}

export const KHYPEExample: Story = {
  name: 'kHYPE Price',
  args: {
    selectedVault: 'kHYPE Prime',
    enabled: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Query options for kHYPE (Kinto staked HYPE). Price tracks HYPE with staking premium.',
      },
    },
  },
}

export const MultipleAssets: Story = {
  name: 'Prefetch Multiple HYPE Assets',
  render: () => {
    const queryClient = useQueryClient()
    const [status, setStatus] = React.useState<Record<string, string>>({})

    const assets = [
      { key: 'WHYPE Prime' as VaultKey, ...VAULTS['WHYPE Prime'] },
      { key: 'kHYPE Prime' as VaultKey, ...VAULTS['kHYPE Prime'] },
      { key: 'WHYPE Yield' as VaultKey, ...VAULTS['WHYPE Yield'] },
    ]

    const queryOptionsMap = assets.map(asset => ({
      ...asset,
      options: usePriceQueryOptions({
        vaultAddress: asset.address,
        enabled: true,
      }),
    }))

    const handlePrefetchAll = async () => {
      for (const { key, options } of queryOptionsMap) {
        setStatus(prev => ({ ...prev, [key]: 'loading' }))
        await queryClient.prefetchQuery(options)
        setStatus(prev => ({ ...prev, [key]: 'done' }))
      }
    }

    return (
      <div style={{ maxWidth: 500 }}>
        <h3 style={{ margin: '0 0 1rem', color: colors.foreground }}>Prefetch Multiple HYPE Assets</h3>

        <button
          type="button"
          onClick={handlePrefetchAll}
          style={{
            padding: '0.75rem 1.5rem',
            borderRadius: 8,
            border: 'none',
            background: colors.primary,
            color: 'rgb(28, 28, 35)',
            fontWeight: 600,
            cursor: 'pointer',
            marginBottom: '1rem',
          }}
        >
          Prefetch All Prices
        </button>

        <div style={{ display: 'grid', gap: '0.5rem' }}>
          {queryOptionsMap.map(({ key, symbol, description }) => (
            <div
              key={key}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.75rem',
                background: status[key] === 'done' ? 'rgba(142, 231, 194, 0.15)' : colors.muted,
                borderRadius: 8,
                border: `1px solid ${status[key] === 'done' ? 'rgba(142, 231, 194, 0.3)' : colors.border}`,
              }}
            >
              <div>
                <span style={{ fontWeight: 600, color: colors.foreground }}>{symbol}</span>
                <span style={{ marginLeft: 8, fontSize: 12, color: colors.mutedForeground }}>
                  {description}
                </span>
              </div>
              <span style={{ fontFamily: "'DM Mono', monospace" }}>
                {status[key] && (
                  <span
                    style={{
                      color: status[key] === 'done' ? colors.primary : colors.mutedForeground,
                    }}
                  >
                    {status[key] === 'done' ? '✓ Cached' : 'Loading...'}
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates prefetching multiple HYPE-based asset prices in sequence.',
      },
    },
  },
}
