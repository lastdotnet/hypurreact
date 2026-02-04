import type { Meta, StoryObj } from '@storybook/react'
import * as React from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { usePriceQueryOptions } from '../hooks/usePriceQueryOptions'

const EXAMPLE_ADDRESSES = {
  USDC: '0xb8ce59fc3717ada4c02eadf9682a9e934f625ebb',
  WETH: '0x4200000000000000000000000000000000000006',
  VAULT: '0x1234567890123456789012345678901234567890',
}

interface UsePriceQueryOptionsDemoProps {
  assetAddress: `0x${string}`
  vaultAddress: `0x${string}`
  enabled: boolean
}

function UsePriceQueryOptionsDemo({
  assetAddress,
  vaultAddress,
  enabled,
}: UsePriceQueryOptionsDemoProps) {
  const queryClient = useQueryClient()
  const [prefetchStatus, setPrefetchStatus] = React.useState<'idle' | 'loading' | 'done'>('idle')
  const [cacheData, setCacheData] = React.useState<unknown>(null)

  const queryOptions = usePriceQueryOptions({
    assetAddress,
    vaultAddress,
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
    <div style={{ maxWidth: 600 }}>
      <h3 style={{ margin: '0 0 1rem', color: 'rgb(250, 250, 252)' }}>usePriceQueryOptions Hook Demo</h3>
      
      <div style={{ 
        background: 'rgb(48, 48, 55)', 
        padding: '1rem', 
        borderRadius: 8,
        marginBottom: '1rem',
        border: '1px solid rgba(250, 250, 252, 0.05)'
      }}>
        <h4 style={{ margin: '0 0 0.5rem', fontSize: 14, color: 'rgb(145, 145, 160)' }}>Parameters</h4>
        <pre style={{ margin: 0, fontSize: 12, overflow: 'auto', background: 'rgb(38, 38, 44)', padding: '0.75rem', borderRadius: 6, color: 'rgb(145, 145, 160)', fontFamily: "'DM Mono', monospace" }}>
{JSON.stringify({
  assetAddress,
  vaultAddress,
  enabled,
}, null, 2)}
        </pre>
      </div>

      <div style={{ 
        background: 'rgb(38, 38, 44)', 
        padding: '1rem', 
        borderRadius: 8,
        marginBottom: '1rem',
        border: '1px solid rgba(250, 250, 252, 0.05)'
      }}>
        <h4 style={{ margin: '0 0 0.5rem', fontSize: 14, color: 'rgb(145, 145, 160)' }}>Query Key</h4>
        <pre style={{ margin: 0, fontSize: 11, overflow: 'auto', wordBreak: 'break-all', color: 'rgb(145, 145, 160)', fontFamily: "'DM Mono', monospace" }}>
          {JSON.stringify(queryOptions.queryKey, null, 2)}
        </pre>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <button 
          type="button"
          onClick={handlePrefetch}
          disabled={prefetchStatus === 'loading'}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: 8,
            border: 'none',
            background: 'rgb(142, 231, 194)',
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
            color: 'rgb(145, 145, 160)',
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

      <div style={{ 
        background: prefetchStatus === 'done' ? 'rgba(142, 231, 194, 0.15)' : 'rgb(48, 48, 55)', 
        padding: '1rem', 
        borderRadius: 8,
        border: `1px solid ${prefetchStatus === 'done' ? 'rgba(142, 231, 194, 0.3)' : 'rgba(250, 250, 252, 0.05)'}`
      }}>
        <h4 style={{ margin: '0 0 0.5rem', fontSize: 14, color: prefetchStatus === 'done' ? 'rgb(142, 231, 194)' : 'rgb(145, 145, 160)' }}>
          Cache Status: {prefetchStatus === 'done' ? 'Cached' : 'Not cached'}
        </h4>
        {cacheData !== null && (
          <pre style={{ margin: 0, fontSize: 12, overflow: 'auto', background: 'rgb(38, 38, 44)', padding: '0.75rem', borderRadius: 6, color: 'rgb(145, 145, 160)', fontFamily: "'DM Mono', monospace" }}>
            {JSON.stringify(cacheData, null, 2)}
          </pre>
        )}
        {cacheData === null && (
          <p style={{ margin: 0, color: 'rgb(145, 145, 160)', fontSize: 12 }}>
            Click "Prefetch Query" to populate the cache, then "Check Cache" to see the data.
          </p>
        )}
      </div>

      <div style={{ 
        marginTop: '1rem',
        padding: '1rem',
        background: 'rgba(255, 152, 0, 0.1)',
        borderRadius: 8,
        border: '1px solid rgba(255, 152, 0, 0.2)',
        fontSize: 13,
        color: 'rgb(250, 250, 252)'
      }}>
        <strong style={{ color: 'rgb(255, 180, 50)' }}>Usage Tips:</strong>
        <ul style={{ margin: '0.5rem 0 0', paddingLeft: '1.25rem', color: 'rgb(145, 145, 160)' }}>
          <li>Use <code style={{ background: 'rgb(38, 38, 44)', padding: '0.125rem 0.375rem', borderRadius: 4, color: 'rgb(145, 145, 160)', fontFamily: "'DM Mono', monospace" }}>prefetchQuery</code> to preload data before navigation</li>
          <li>Query keys are stable and can be used for cache invalidation</li>
          <li>Combine with <code style={{ background: 'rgb(38, 38, 44)', padding: '0.125rem 0.375rem', borderRadius: 4, color: 'rgb(145, 145, 160)', fontFamily: "'DM Mono', monospace" }}>usePrice</code> for automatic cache hits</li>
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
  assetAddress: '0x...',
  vaultAddress: '0x...',
})

// Prefetch the query
await queryClient.prefetchQuery(queryOptions)

// Later, usePrice will hit the cache
const { priceUSD } = usePrice({ ... })
\`\`\`
        `,
      },
    },
  },
  argTypes: {
    assetAddress: {
      control: 'text',
      description: 'The asset address to get price for',
    },
    vaultAddress: {
      control: 'text',
      description: 'The vault address (used in query key)',
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
  name: 'Interactive Demo',
  args: {
    assetAddress: EXAMPLE_ADDRESSES.USDC as `0x${string}`,
    vaultAddress: EXAMPLE_ADDRESSES.VAULT as `0x${string}`,
    enabled: true,
  },
}

export const WETHExample: Story = {
  name: 'WETH Query Options',
  args: {
    assetAddress: EXAMPLE_ADDRESSES.WETH as `0x${string}`,
    vaultAddress: EXAMPLE_ADDRESSES.VAULT as `0x${string}`,
    enabled: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Query options for WETH - prices are fetched internally from the indexer.',
      },
    },
  },
}

export const MultipleAssets: Story = {
  name: 'Prefetching Multiple Assets',
  render: () => {
    const queryClient = useQueryClient()
    const [status, setStatus] = React.useState<Record<string, string>>({})

    const assets = [
      { name: 'USDC', address: EXAMPLE_ADDRESSES.USDC },
      { name: 'WETH', address: EXAMPLE_ADDRESSES.WETH },
    ]

    const queryOptionsMap = assets.map(asset => ({
      ...asset,
      options: usePriceQueryOptions({
        assetAddress: asset.address as `0x${string}`,
        vaultAddress: EXAMPLE_ADDRESSES.VAULT as `0x${string}`,
        enabled: true,
      }),
    }))

    const handlePrefetchAll = async () => {
      for (const { name, options } of queryOptionsMap) {
        setStatus(prev => ({ ...prev, [name]: 'loading' }))
        await queryClient.prefetchQuery(options)
        setStatus(prev => ({ ...prev, [name]: 'done' }))
      }
    }

    return (
      <div style={{ maxWidth: 500 }}>
        <h3 style={{ margin: '0 0 1rem', color: 'rgb(250, 250, 252)' }}>Prefetch Multiple Assets</h3>
        
        <button 
          type="button"
          onClick={handlePrefetchAll}
          style={{
            padding: '0.75rem 1.5rem',
            borderRadius: 8,
            border: 'none',
            background: 'rgb(142, 231, 194)',
            color: 'rgb(28, 28, 35)',
            fontWeight: 600,
            cursor: 'pointer',
            marginBottom: '1rem',
          }}
        >
          Prefetch All Prices
        </button>

        <div style={{ display: 'grid', gap: '0.5rem' }}>
          {queryOptionsMap.map(({ name }) => (
            <div 
              key={name}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '0.75rem',
                background: status[name] === 'done' ? 'rgba(142, 231, 194, 0.15)' : 'rgb(48, 48, 55)',
                borderRadius: 8,
                border: `1px solid ${status[name] === 'done' ? 'rgba(142, 231, 194, 0.3)' : 'rgba(250, 250, 252, 0.05)'}`,
              }}
            >
              <span style={{ fontWeight: 500, color: 'rgb(250, 250, 252)' }}>{name}</span>
              <span style={{ fontFamily: "'DM Mono', monospace" }}>
                {status[name] && (
                  <span style={{ 
                    marginLeft: 8, 
                    color: status[name] === 'done' ? 'rgb(142, 231, 194)' : 'rgb(145, 145, 160)' 
                  }}>
                    {status[name] === 'done' ? 'Cached' : 'Loading...'}
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
        story: 'Demonstrates prefetching multiple asset prices in sequence.',
      },
    },
  },
}
