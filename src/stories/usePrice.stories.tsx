import type { Meta, StoryObj } from '@storybook/react'
import * as React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider, createConfig, http } from 'wagmi'
import { VaultProvider, createVaultConfig } from '../index'
import { usePrice } from '../hooks/usePrice'

const EXAMPLE_ADDRESSES = {
  USDC_VAULT: '0xC200AaB602Cd7046389B5C8FB088884323F8dD0f',
  WHYPE_VAULT: '0xF73c654d468f5485bF15F3470B78851a49257704',
  UBTC_VAULT: '0x8A4545827DF5446Ba120B904e5306e58acCA4E89',
}

interface UsePriceDemoProps {
  vaultAddress?: `0x${string}`
  oracleAddress?: `0x${string}`
  unitOfAccount?: `0x${string}`
  enabled: boolean
}

function UsePriceDemo({ vaultAddress, oracleAddress, unitOfAccount, enabled }: UsePriceDemoProps) {
  const { priceUSD, isLoading, isError, error, source } = usePrice({
    vaultAddress,
    oracleAddress,
    unitOfAccount,
    enabled,
  })

  return (
    <div style={{ maxWidth: 500 }}>
      <h3 style={{ margin: '0 0 1rem', color: 'rgb(250, 250, 252)' }}>usePrice Hook Demo</h3>

      <div
        style={{
          background: 'rgb(48, 48, 55)',
          padding: '1rem',
          borderRadius: 8,
          border: '1px solid rgba(250, 250, 252, 0.05)',
          marginBottom: '1rem',
        }}
      >
        <h4 style={{ margin: '0 0 0.5rem', fontSize: 14, color: 'rgb(145, 145, 160)' }}>Parameters</h4>
        <pre
          style={{
            margin: 0,
            fontSize: 12,
            overflow: 'auto',
            background: 'rgb(38, 38, 44)',
            padding: '0.75rem',
            borderRadius: 6,
            color: 'rgb(145, 145, 160)',
            fontFamily: "'DM Mono', monospace",
          }}
        >
          {JSON.stringify(
            {
              vaultAddress: vaultAddress || 'undefined',
              oracleAddress: oracleAddress || 'undefined',
              unitOfAccount: unitOfAccount || 'undefined',
              enabled,
            },
            null,
            2,
          )}
        </pre>
      </div>

      <div
        style={{
          background: isError
            ? 'rgba(180, 70, 70, 0.15)'
            : isLoading
              ? 'rgba(255, 152, 0, 0.15)'
              : 'rgba(142, 231, 194, 0.15)',
          padding: '1rem',
          borderRadius: 8,
          border: `1px solid ${isError ? 'rgba(180, 70, 70, 0.3)' : isLoading ? 'rgba(255, 152, 0, 0.3)' : 'rgba(142, 231, 194, 0.3)'}`,
        }}
      >
        <h4 style={{ margin: '0 0 0.5rem', fontSize: 14, color: 'rgb(145, 145, 160)' }}>Result</h4>

        <div style={{ display: 'grid', gap: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 500, color: 'rgb(145, 145, 160)' }}>Price USD:</span>
            <span
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 18,
                fontWeight: 'bold',
                color: 'rgb(250, 250, 252)',
              }}
            >
              ${priceUSD.toFixed(4)}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 500, color: 'rgb(145, 145, 160)' }}>Source:</span>
            <div
              style={{
                background: 'linear-gradient(135deg, #fbe572 0%, #c2f4bc 100%)',
                padding: 1,
                borderRadius: 7,
                display: 'inline-block',
              }}
            >
              <div
                style={{
                  background: 'rgb(15, 15, 17)',
                  borderRadius: 6,
                  padding: '3px 8px',
                  color: 'rgb(145, 145, 160)',
                  fontSize: 12,
                  fontWeight: 500,
                }}
              >
                {source}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 500, color: 'rgb(145, 145, 160)' }}>Status:</span>
            <span style={{ color: isLoading ? 'rgb(255, 152, 0)' : 'rgb(142, 231, 194)' }}>
              {isLoading ? 'Loading...' : 'Ready'}
            </span>
          </div>

          {isError && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 500, color: 'rgb(145, 145, 160)' }}>Error:</span>
              <span style={{ color: 'rgb(180, 70, 70)' }}>{error?.message}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const meta: Meta<typeof UsePriceDemo> = {
  title: 'Hooks/usePrice',
  component: UsePriceDemo,
  parameters: {
    docs: {
      description: {
        component: `
The main hook for fetching asset prices in USD. Automatically fetches prices from the indexer 
(if configured) with on-chain oracle as fallback.

**Price Resolution Behavior:**
- If \`indexerUrl\` is configured in OracleProvider, prices are fetched from indexer first
- Falls back to on-chain oracle query when indexer price is unavailable
- Source indicator shows where the price came from: 'indexer' or 'vaultOracle'
        `,
      },
    },
  },
  argTypes: {
    vaultAddress: {
      control: 'text',
      description: 'The vault address to fetch price for',
    },
    oracleAddress: {
      control: 'text',
      description: 'Direct oracle address (skips vault config fetch)',
    },
    unitOfAccount: {
      control: 'text',
      description: 'Direct unit of account address',
    },
    enabled: {
      control: 'boolean',
      description: 'Whether the query is enabled',
    },
  },
}

export default meta
type Story = StoryObj<typeof UsePriceDemo>

export const USDCVault: Story = {
  name: 'USDC Vault (Auto-fetch from Indexer)',
  args: {
    vaultAddress: EXAMPLE_ADDRESSES.USDC_VAULT as `0x${string}`,
    enabled: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Fetches USDC vault price from indexer automatically. Shows real-time price data.',
      },
    },
  },
}

export const WHYPEVault: Story = {
  name: 'WHYPE Vault',
  args: {
    vaultAddress: EXAMPLE_ADDRESSES.WHYPE_VAULT as `0x${string}`,
    enabled: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Fetches WHYPE vault price from indexer.',
      },
    },
  },
}

export const UBTCVault: Story = {
  name: 'UBTC Vault',
  args: {
    vaultAddress: EXAMPLE_ADDRESSES.UBTC_VAULT as `0x${string}`,
    enabled: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Fetches UBTC vault price. May fall back to oracle if indexer price unavailable.',
      },
    },
  },
}

export const Disabled: Story = {
  name: 'Disabled Query',
  args: {
    vaultAddress: EXAMPLE_ADDRESSES.USDC_VAULT as `0x${string}`,
    enabled: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'When enabled is false, no queries are made.',
      },
    },
  },
}

const hyperEVM = {
  id: 999,
  name: 'HyperEVM',
  nativeCurrency: { decimals: 18, name: 'HYPE', symbol: 'HYPE' },
  rpcUrls: { default: { http: ['https://rpc.hyperliquid.xyz/evm'] } },
} as const

const noIndexerWagmiConfig = createConfig({
  chains: [hyperEVM],
  transports: { [hyperEVM.id]: http(hyperEVM.rpcUrls.default.http[0]) },
})

const noIndexerVaultConfig = createVaultConfig({
  chainId: 999,
  usdUnitOfAccount: '0x0000000000000000000000000000000000000348',
  usdReferenceToken: '0xb8ce59fc3717ada4c02eadf9682a9e934f625ebb',
})

function IndexerDownDemo({ vaultAddress }: { vaultAddress: `0x${string}` }) {
  const [queryClient] = React.useState(() => new QueryClient())
  
  return (
    <WagmiProvider config={noIndexerWagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <VaultProvider config={noIndexerVaultConfig}>
          <IndexerDownContent vaultAddress={vaultAddress} />
        </VaultProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}

function IndexerDownContent({ vaultAddress }: { vaultAddress: `0x${string}` }) {
  const { priceUSD, isLoading, isError, error, source } = usePrice({
    vaultAddress,
    enabled: true,
  })

  return (
    <div style={{ maxWidth: 500 }}>
      <h3 style={{ margin: '0 0 1rem', color: 'rgb(250, 250, 252)' }}>
        usePrice - Indexer Down (On-Chain Fallback)
      </h3>

      <div
        style={{
          background: 'rgba(255, 152, 0, 0.15)',
          border: '1px solid rgba(255, 152, 0, 0.3)',
          borderRadius: 8,
          padding: '0.75rem 1rem',
          marginBottom: '1rem',
          fontSize: 14,
          color: 'rgb(250, 250, 252)',
        }}
      >
        <strong>Simulating:</strong> No indexerUrl configured — prices fetched directly from on-chain oracle
      </div>

      <div
        style={{
          background: 'rgb(48, 48, 55)',
          padding: '1rem',
          borderRadius: 8,
          border: '1px solid rgba(250, 250, 252, 0.05)',
          marginBottom: '1rem',
        }}
      >
        <h4 style={{ margin: '0 0 0.5rem', fontSize: 14, color: 'rgb(145, 145, 160)' }}>
          Config (no indexerUrl)
        </h4>
        <pre
          style={{
            margin: 0,
            fontSize: 12,
            overflow: 'auto',
            background: 'rgb(38, 38, 44)',
            padding: '0.75rem',
            borderRadius: 6,
            color: 'rgb(145, 145, 160)',
            fontFamily: "'DM Mono', monospace",
          }}
        >
{`{
  chainId: 999,
  usdUnitOfAccount: "0x...348",
  usdReferenceToken: "0x...ebb"
  // indexerUrl: undefined
}`}
        </pre>
      </div>

      <div
        style={{
          background: isError
            ? 'rgba(180, 70, 70, 0.15)'
            : isLoading
              ? 'rgba(255, 152, 0, 0.15)'
              : 'rgba(142, 231, 194, 0.15)',
          padding: '1rem',
          borderRadius: 8,
          border: `1px solid ${isError ? 'rgba(180, 70, 70, 0.3)' : isLoading ? 'rgba(255, 152, 0, 0.3)' : 'rgba(142, 231, 194, 0.3)'}`,
        }}
      >
        <h4 style={{ margin: '0 0 0.5rem', fontSize: 14, color: 'rgb(145, 145, 160)' }}>Result</h4>

        <div style={{ display: 'grid', gap: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 500, color: 'rgb(145, 145, 160)' }}>Price USD:</span>
            <span
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 18,
                fontWeight: 'bold',
                color: 'rgb(250, 250, 252)',
              }}
            >
              ${priceUSD.toFixed(4)}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 500, color: 'rgb(145, 145, 160)' }}>Source:</span>
            <div
              style={{
                background: source === 'vaultOracle' 
                  ? 'linear-gradient(135deg, #ff9800 0%, #ff5722 100%)'
                  : 'linear-gradient(135deg, #fbe572 0%, #c2f4bc 100%)',
                padding: 1,
                borderRadius: 7,
                display: 'inline-block',
              }}
            >
              <div
                style={{
                  background: 'rgb(15, 15, 17)',
                  borderRadius: 6,
                  padding: '3px 8px',
                  color: 'rgb(145, 145, 160)',
                  fontSize: 12,
                  fontWeight: 500,
                }}
              >
                {source} {source === 'vaultOracle' && '(on-chain)'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 500, color: 'rgb(145, 145, 160)' }}>Status:</span>
            <span style={{ color: isLoading ? 'rgb(255, 152, 0)' : 'rgb(142, 231, 194)' }}>
              {isLoading ? 'Loading from chain...' : 'Ready'}
            </span>
          </div>

          {isError && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 500, color: 'rgb(145, 145, 160)' }}>Error:</span>
              <span style={{ color: 'rgb(180, 70, 70)' }}>{error?.message}</span>
            </div>
          )}
        </div>
      </div>

      <div
        style={{
          marginTop: '1rem',
          padding: '0.75rem 1rem',
          background: 'rgb(38, 38, 44)',
          borderRadius: 8,
          fontSize: 12,
          color: 'rgb(145, 145, 160)',
        }}
      >
        <strong>Flow:</strong> vault.oracle() → vault.unitOfAccount() → oracle.getQuote()
      </div>
    </div>
  )
}

export const IndexerDown: Story = {
  name: 'Indexer Down (On-Chain Fallback)',
  render: () => <IndexerDownDemo vaultAddress={EXAMPLE_ADDRESSES.USDC_VAULT as `0x${string}`} />,
  parameters: {
    docs: {
      description: {
        story: `
Demonstrates the on-chain fallback when the indexer is unavailable.

**What happens:**
1. No \`indexerUrl\` in config → indexer check skipped
2. Hook fetches \`oracle()\` and \`unitOfAccount()\` from vault contract
3. Hook queries price via \`oracle.getQuote()\`
4. Source shows "vaultOracle" instead of "indexer"

This is the same behavior that occurs when the indexer is down or doesn't have a price for the vault.
        `,
      },
    },
  },
}

export const StalePriceFallback: Story = {
  name: 'Stale Price Fallback (>15min)',
  render: () => {
    return (
      <div style={{ maxWidth: 600 }}>
        <h3 style={{ margin: '0 0 1rem', color: 'rgb(250, 250, 252)' }}>
          Stale Price Detection & Fallback
        </h3>

        <div
          style={{
            background: 'rgba(255, 152, 0, 0.15)',
            border: '1px solid rgba(255, 152, 0, 0.3)',
            borderRadius: 8,
            padding: '0.75rem 1rem',
            marginBottom: '1rem',
            fontSize: 14,
            color: 'rgb(250, 250, 252)',
          }}
        >
          <strong>Scenario:</strong> Indexer price is older than 15 minutes
        </div>

        <div
          style={{
            background: 'rgb(48, 48, 55)',
            padding: '1rem',
            borderRadius: 8,
            border: '1px solid rgba(250, 250, 252, 0.05)',
            marginBottom: '1rem',
          }}
        >
          <h4 style={{ margin: '0 0 0.5rem', fontSize: 14, color: 'rgb(145, 145, 160)' }}>
            How It Works
          </h4>
          <div style={{ fontSize: 13, color: 'rgb(145, 145, 160)', lineHeight: 1.6 }}>
            <p>When <code>usePrice</code> or <code>useVaultInfo</code> receive price data from the indexer, they check the <code>assetPriceTimestamp</code>:</p>

            <ol style={{ paddingLeft: '1.5rem', margin: '0.5rem 0' }}>
              <li><strong>Fresh Price (&lt;15min):</strong> Use indexer price, source: "indexer"</li>
              <li><strong>Stale Price (&gt;15min):</strong> Treat as null, fall back to on-chain oracle, source: "vaultOracle"</li>
              <li><strong>Missing Timestamp:</strong> Treat as stale, fall back to on-chain</li>
              <li><strong>Invalid Timestamp:</strong> Treat as stale, fall back to on-chain</li>
            </ol>
          </div>
        </div>

        <div
          style={{
            background: 'rgb(48, 48, 55)',
            padding: '1rem',
            borderRadius: 8,
            border: '1px solid rgba(250, 250, 252, 0.05)',
            marginBottom: '1rem',
          }}
        >
          <h4 style={{ margin: '0 0 0.5rem', fontSize: 14, color: 'rgb(145, 145, 160)' }}>
            Why 15 Minutes?
          </h4>
          <div style={{ fontSize: 13, color: 'rgb(145, 145, 160)', lineHeight: 1.6 }}>
            <p>The 15-minute threshold balances two concerns:</p>
            <ul style={{ paddingLeft: '1.5rem', margin: '0.5rem 0' }}>
              <li><strong>Freshness:</strong> Ensures users see reasonably current prices in volatile markets</li>
              <li><strong>Reliability:</strong> Prevents excessive on-chain calls for minor indexer delays</li>
            </ul>
          </div>
        </div>

        <div
          style={{
            background: 'rgb(48, 48, 55)',
            padding: '1rem',
            borderRadius: 8,
            border: '1px solid rgba(250, 250, 252, 0.05)',
          }}
        >
          <h4 style={{ margin: '0 0 0.5rem', fontSize: 14, color: 'rgb(145, 145, 160)' }}>
            Code Example
          </h4>
          <pre
            style={{
              margin: 0,
              fontSize: 11,
              overflow: 'auto',
              background: 'rgb(38, 38, 44)',
              padding: '0.75rem',
              borderRadius: 6,
              color: 'rgb(145, 145, 160)',
              fontFamily: "'DM Mono', monospace",
            }}
          >
{`// In useIndexerPrices.ts
const PRICE_STALENESS_THRESHOLD = 15 * 60 * 1000 // 15 minutes

function isPriceStale(timestamp: string | undefined): boolean {
  if (!timestamp) return true

  try {
    const priceTime = new Date(timestamp).getTime()
    if (isNaN(priceTime)) return true

    const now = Date.now()
    const age = now - priceTime
    return age > PRICE_STALENESS_THRESHOLD
  } catch {
    return true
  }
}

// Prices older than 15min are set to null → triggers fallback
priceMap[vaultAddress] = isStale ? null : item.assetPrice`}
          </pre>
        </div>

        <div
          style={{
            marginTop: '1rem',
            padding: '0.75rem 1rem',
            background: 'rgba(142, 231, 194, 0.15)',
            border: '1px solid rgba(142, 231, 194, 0.3)',
            borderRadius: 8,
            fontSize: 12,
            color: 'rgb(250, 250, 252)',
          }}
        >
          <strong>✓ Result:</strong> Users always get reliable prices, even when indexer data is outdated
        </div>
      </div>
    )
  },
  parameters: {
    docs: {
      description: {
        story: `
Demonstrates automatic fallback to on-chain pricing when indexer prices are stale (>15 minutes old).

**Staleness Check Flow:**
1. \`useIndexerPrices\` fetches prices from indexer's \`v2/vault/list\` endpoint
2. For each price, check if \`assetPriceTimestamp\` is older than 15 minutes
3. If stale, set price to \`null\` (same as if indexer had no price)
4. \`usePrice\` detects \`null\` and automatically falls back to on-chain oracle
5. Source switches from "indexer" to "vaultOracle"

**When This Matters:**
- Indexer is running but slow to update prices
- Price feeds are down for specific assets
- Network issues causing delayed indexer updates
- Ensures users never see dangerously outdated prices in volatile markets

**Implementation:**
Both \`useIndexerPrices\` and \`useIndexerVaultData\` check \`assetPriceTimestamp\` before returning prices.
This check happens transparently at the data layer, so all consuming hooks automatically benefit.
        `,
      },
    },
  },
}
