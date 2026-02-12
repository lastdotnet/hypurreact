import type { Meta, StoryObj } from '@storybook/react'
import * as React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider, createConfig, http } from 'wagmi'
import { VaultProvider, createVaultConfig } from '../index'
import { usePrice } from '../hooks/usePrice'
import type { Address } from 'viem'

// Real vault addresses on HyperEVM with their asset info
const VAULTS = {
  'WHYPE Prime': {
    address: '0xF73c654d468f5485bF15F3470B78851a49257704' as Address,
    symbol: 'WHYPE',
    description: 'Wrapped HYPE (~$20-30)',
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
  'hwHYPE Yield': {
    address: '0xBb7DC37dbc108d40BcdD60403EF7bFDD6489071E' as Address,
    symbol: 'hwHYPE',
    description: 'Hyperwave staked HYPE',
  },
  'USDC Vault': {
    address: '0xC200AaB602Cd7046389B5C8FB088884323F8dD0f' as Address,
    symbol: 'USDC',
    description: 'Stablecoin (~$1.00)',
  },
  'UBTC Vault': {
    address: '0x8A4545827DF5446Ba120B904e5306e58acCA4E89' as Address,
    symbol: 'UBTC',
    description: 'Universal BTC',
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
  error: 'rgb(180, 70, 70)',
  warning: 'rgb(255, 152, 0)',
}

interface UsePriceDemoProps {
  selectedVault: VaultKey
  enabled: boolean
}

function UsePriceDemo({ selectedVault, enabled }: UsePriceDemoProps) {
  const vault = VAULTS[selectedVault]
  const { priceUSD, isLoading, isError, error, source } = usePrice({
    vaultAddress: vault.address,
    enabled,
  })

  return (
    <div style={{ maxWidth: 550 }}>
      <h3 style={{ margin: '0 0 1rem', color: colors.foreground }}>usePrice Hook Demo</h3>

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              background: colors.panel,
              borderRadius: 8,
              padding: '0.75rem 1.25rem',
              minWidth: 90,
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 22, fontWeight: 700, color: colors.primary }}>{vault.symbol}</div>
          </div>
          <div>
            <div style={{ fontWeight: 600, color: colors.foreground, fontSize: 15 }}>{selectedVault}</div>
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

      {/* Price Result */}
      <div
        style={{
          background: isError
            ? 'rgba(180, 70, 70, 0.15)'
            : isLoading
              ? 'rgba(255, 152, 0, 0.15)'
              : 'rgba(142, 231, 194, 0.15)',
          padding: '1.25rem',
          borderRadius: 12,
          border: `1px solid ${isError ? 'rgba(180, 70, 70, 0.3)' : isLoading ? 'rgba(255, 152, 0, 0.3)' : 'rgba(142, 231, 194, 0.3)'}`,
        }}
      >
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {/* Price Display */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 500, color: colors.mutedForeground }}>{vault.symbol} Price:</span>
            <span
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 26,
                fontWeight: 'bold',
                color: colors.foreground,
              }}
            >
              {isLoading ? '...' : `$${priceUSD.toFixed(4)}`}
            </span>
          </div>

          {/* Source Badge */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 500, color: colors.mutedForeground }}>Source:</span>
            <div
              style={{
                background:
                  source === 'indexer'
                    ? 'linear-gradient(135deg, #fbe572 0%, #c2f4bc 100%)'
                    : 'linear-gradient(135deg, #72b4fb 0%, #a78bfa 100%)',
                padding: 1,
                borderRadius: 7,
              }}
            >
              <div
                style={{
                  background: 'rgb(15, 15, 17)',
                  borderRadius: 6,
                  padding: '4px 10px',
                  color: colors.mutedForeground,
                  fontSize: 12,
                  fontWeight: 500,
                }}
              >
                {source === 'indexer' ? '✓ Indexer' : '⛓ On-chain Oracle'}
              </div>
            </div>
          </div>

          {/* Status */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 500, color: colors.mutedForeground }}>Status:</span>
            <span style={{ color: isLoading ? colors.warning : colors.primary, fontWeight: 500 }}>
              {isLoading ? 'Loading...' : 'Ready'}
            </span>
          </div>

          {/* Error Display */}
          {isError && (
            <div
              style={{
                background: 'rgba(180, 70, 70, 0.2)',
                padding: '0.5rem 0.75rem',
                borderRadius: 6,
                marginTop: '0.25rem',
              }}
            >
              <span style={{ color: colors.error, fontSize: 13 }}>Error: {error?.message}</span>
            </div>
          )}
        </div>
      </div>

      {/* Hook Parameters */}
      <div style={{ marginTop: '1rem' }}>
        <h4 style={{ margin: '0 0 0.5rem', fontSize: 13, color: colors.mutedForeground }}>
          Hook Parameters
        </h4>
        <pre
          style={{
            margin: 0,
            fontSize: 11,
            overflow: 'auto',
            background: colors.panel,
            padding: '0.75rem',
            borderRadius: 6,
            color: colors.mutedForeground,
            fontFamily: "'DM Mono', monospace",
          }}
        >
          {JSON.stringify(
            {
              vaultAddress: vault.address,
              enabled,
            },
            null,
            2,
          )}
        </pre>
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
- If \`indexerUrl\` is configured, prices are fetched from indexer first
- Falls back to on-chain oracle query when indexer price is unavailable
- Source indicator shows where the price came from: 'indexer' or 'vaultOracle'
- Stale prices (>15 minutes old) automatically trigger on-chain fallback
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
type Story = StoryObj<typeof UsePriceDemo>

export const WHYPEPrice: Story = {
  name: 'WHYPE Price (~$20-30)',
  args: {
    selectedVault: 'WHYPE Prime',
    enabled: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Fetches WHYPE (Wrapped HYPE) price. HYPE typically trades around $20-30.',
      },
    },
  },
}

export const KHYPEPrice: Story = {
  name: 'kHYPE Price',
  args: {
    selectedVault: 'kHYPE Prime',
    enabled: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Fetches kHYPE (Kinto staked HYPE) price. Tracks HYPE with potential staking premium.',
      },
    },
  },
}

export const HWHYPEPrice: Story = {
  name: 'hwHYPE Price',
  args: {
    selectedVault: 'hwHYPE Yield',
    enabled: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Fetches hwHYPE (Hyperwave staked HYPE) price.',
      },
    },
  },
}

export const UBTCPrice: Story = {
  name: 'UBTC Price (~$100k)',
  args: {
    selectedVault: 'UBTC Vault',
    enabled: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Fetches UBTC (Universal BTC) price. Bitcoin-pegged asset.',
      },
    },
  },
}

export const USDCPrice: Story = {
  name: 'USDC Price (~$1.00)',
  args: {
    selectedVault: 'USDC Vault',
    enabled: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Fetches USDC stablecoin price. Should be approximately $1.00.',
      },
    },
  },
}

export const Disabled: Story = {
  name: 'Disabled Query',
  args: {
    selectedVault: 'WHYPE Prime',
    enabled: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'When enabled is false, no queries are made and price stays at 0.',
      },
    },
  },
}

// Custom provider for on-chain fallback demo
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
  // No indexerUrl - forces on-chain oracle
})

function IndexerDownDemo({ selectedVault }: { selectedVault: VaultKey }) {
  const vault = VAULTS[selectedVault]
  const [queryClient] = React.useState(() => new QueryClient())

  return (
    <WagmiProvider config={noIndexerWagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <VaultProvider config={noIndexerVaultConfig}>
          <IndexerDownContent vault={vault} vaultKey={selectedVault} />
        </VaultProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}

function IndexerDownContent({
  vault,
  vaultKey,
}: {
  vault: (typeof VAULTS)[VaultKey]
  vaultKey: VaultKey
}) {
  const { priceUSD, isLoading, isError, error, source } = usePrice({
    vaultAddress: vault.address,
    enabled: true,
  })

  return (
    <div style={{ maxWidth: 550 }}>
      <h3 style={{ margin: '0 0 1rem', color: colors.foreground }}>
        usePrice - On-Chain Fallback Demo
      </h3>

      {/* Scenario Banner */}
      <div
        style={{
          background: 'rgba(255, 152, 0, 0.15)',
          border: '1px solid rgba(255, 152, 0, 0.3)',
          borderRadius: 8,
          padding: '0.75rem 1rem',
          marginBottom: '1rem',
          fontSize: 14,
          color: colors.foreground,
        }}
      >
        <strong>🧪 Simulating:</strong> No indexerUrl configured — prices fetched directly from
        on-chain oracle
      </div>

      {/* Selected Asset */}
      <div
        style={{
          background: colors.muted,
          padding: '1rem',
          borderRadius: 8,
          border: `1px solid ${colors.border}`,
          marginBottom: '1rem',
        }}
      >
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
            <div style={{ fontWeight: 600, color: colors.foreground }}>{vaultKey}</div>
            <div style={{ fontSize: 12, color: colors.mutedForeground }}>{vault.description}</div>
          </div>
        </div>
      </div>

      {/* Price Result */}
      <div
        style={{
          background: isError
            ? 'rgba(180, 70, 70, 0.15)'
            : isLoading
              ? 'rgba(255, 152, 0, 0.15)'
              : 'rgba(114, 180, 251, 0.15)',
          padding: '1.25rem',
          borderRadius: 12,
          border: `1px solid ${isError ? 'rgba(180, 70, 70, 0.3)' : isLoading ? 'rgba(255, 152, 0, 0.3)' : 'rgba(114, 180, 251, 0.3)'}`,
        }}
      >
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 500, color: colors.mutedForeground }}>{vault.symbol} Price:</span>
            <span
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 24,
                fontWeight: 'bold',
                color: colors.foreground,
              }}
            >
              {isLoading ? '...' : `$${priceUSD.toFixed(4)}`}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 500, color: colors.mutedForeground }}>Source:</span>
            <div
              style={{
                background: 'linear-gradient(135deg, #72b4fb 0%, #a78bfa 100%)',
                padding: 1,
                borderRadius: 7,
              }}
            >
              <div
                style={{
                  background: 'rgb(15, 15, 17)',
                  borderRadius: 6,
                  padding: '4px 10px',
                  color: colors.mutedForeground,
                  fontSize: 12,
                  fontWeight: 500,
                }}
              >
                ⛓ {source} (on-chain)
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 500, color: colors.mutedForeground }}>Status:</span>
            <span style={{ color: isLoading ? colors.warning : '#72b4fb', fontWeight: 500 }}>
              {isLoading ? 'Loading from chain...' : 'Ready'}
            </span>
          </div>

          {isError && (
            <div
              style={{
                background: 'rgba(180, 70, 70, 0.2)',
                padding: '0.5rem 0.75rem',
                borderRadius: 6,
              }}
            >
              <span style={{ color: colors.error, fontSize: 13 }}>Error: {error?.message}</span>
            </div>
          )}
        </div>
      </div>

      {/* Flow Explanation */}
      <div
        style={{
          marginTop: '1rem',
          padding: '0.75rem 1rem',
          background: colors.panel,
          borderRadius: 8,
          fontSize: 12,
          color: colors.mutedForeground,
        }}
      >
        <strong>On-chain Flow:</strong> vault.oracle() → vault.unitOfAccount() → oracle.getQuote()
      </div>
    </div>
  )
}

export const IndexerDown: Story = {
  name: '🧪 No Indexer (On-Chain Only)',
  render: () => <IndexerDownDemo selectedVault="WHYPE Prime" />,
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

// Force On-Chain Demo component using forceOnchain parameter
interface ForceOnchainDemoProps {
  selectedVault: VaultKey
}

function ForceOnchainDemo({ selectedVault }: ForceOnchainDemoProps) {
  const vault = VAULTS[selectedVault]

  // Regular price (uses indexer)
  const indexerPrice = usePrice({
    vaultAddress: vault.address,
    enabled: true,
  })

  // Force on-chain price (bypasses indexer)
  const onchainPrice = usePrice({
    vaultAddress: vault.address,
    enabled: true,
    forceOnchain: true,
  })

  return (
    <div style={{ maxWidth: 600 }}>
      <h3 style={{ margin: '0 0 1rem', color: colors.foreground }}>
        usePrice - forceOnchain Comparison
      </h3>

      {/* Explanation Banner */}
      <div
        style={{
          background: 'rgba(114, 180, 251, 0.15)',
          border: '1px solid rgba(114, 180, 251, 0.3)',
          borderRadius: 8,
          padding: '0.75rem 1rem',
          marginBottom: '1rem',
          fontSize: 14,
          color: colors.foreground,
        }}
      >
        <strong>⛓ forceOnchain=true:</strong> Bypasses indexed data and fetches price directly from the on-chain oracle
      </div>

      {/* Selected Asset */}
      <div
        style={{
          background: colors.muted,
          padding: '1rem',
          borderRadius: 8,
          border: `1px solid ${colors.border}`,
          marginBottom: '1rem',
        }}
      >
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
          </div>
        </div>
      </div>

      {/* Side by side comparison */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        {/* Indexer Price */}
        <div
          style={{
            background: 'rgba(142, 231, 194, 0.15)',
            padding: '1rem',
            borderRadius: 12,
            border: '1px solid rgba(142, 231, 194, 0.3)',
          }}
        >
          <h4 style={{ margin: '0 0 0.75rem', fontSize: 13, color: colors.mutedForeground }}>
            Default (Indexer)
          </h4>
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            <div>
              <div style={{ fontSize: 11, color: colors.mutedForeground }}>Price</div>
              <div
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 20,
                  fontWeight: 'bold',
                  color: colors.foreground,
                }}
              >
                {indexerPrice.isLoading ? '...' : `$${indexerPrice.priceUSD.toFixed(4)}`}
              </div>
            </div>
            <div
              style={{
                background: 'linear-gradient(135deg, #fbe572 0%, #c2f4bc 100%)',
                padding: 1,
                borderRadius: 5,
                alignSelf: 'flex-start',
              }}
            >
              <div
                style={{
                  background: 'rgb(15, 15, 17)',
                  borderRadius: 4,
                  padding: '2px 8px',
                  color: colors.mutedForeground,
                  fontSize: 11,
                }}
              >
                {indexerPrice.source === 'indexer' ? '✓ Indexer' : `⛓ ${indexerPrice.source}`}
              </div>
            </div>
          </div>
        </div>

        {/* On-Chain Price */}
        <div
          style={{
            background: 'rgba(114, 180, 251, 0.15)',
            padding: '1rem',
            borderRadius: 12,
            border: '1px solid rgba(114, 180, 251, 0.3)',
          }}
        >
          <h4 style={{ margin: '0 0 0.75rem', fontSize: 13, color: colors.mutedForeground }}>
            forceOnchain=true
          </h4>
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            <div>
              <div style={{ fontSize: 11, color: colors.mutedForeground }}>Price</div>
              <div
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 20,
                  fontWeight: 'bold',
                  color: colors.foreground,
                }}
              >
                {onchainPrice.isLoading ? '...' : `$${onchainPrice.priceUSD.toFixed(4)}`}
              </div>
            </div>
            <div
              style={{
                background: 'linear-gradient(135deg, #72b4fb 0%, #a78bfa 100%)',
                padding: 1,
                borderRadius: 5,
                alignSelf: 'flex-start',
              }}
            >
              <div
                style={{
                  background: 'rgb(15, 15, 17)',
                  borderRadius: 4,
                  padding: '2px 8px',
                  color: colors.mutedForeground,
                  fontSize: 11,
                }}
              >
                ⛓ {onchainPrice.source}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Code Example */}
      <div style={{ marginTop: '1rem' }}>
        <h4 style={{ margin: '0 0 0.5rem', fontSize: 13, color: colors.mutedForeground }}>
          Usage
        </h4>
        <pre
          style={{
            margin: 0,
            fontSize: 11,
            overflow: 'auto',
            background: colors.panel,
            padding: '0.75rem',
            borderRadius: 6,
            color: colors.mutedForeground,
            fontFamily: "'DM Mono', monospace",
          }}
        >
{`const { priceUSD, source } = usePrice({
  vaultAddress: '${vault.address}',
  forceOnchain: true, // ← Bypass indexer
})`}
        </pre>
      </div>

      {/* Use Cases */}
      <div
        style={{
          marginTop: '1rem',
          padding: '0.75rem 1rem',
          background: 'rgba(255, 152, 0, 0.1)',
          borderRadius: 8,
          border: '1px solid rgba(255, 152, 0, 0.2)',
          fontSize: 12,
          color: colors.foreground,
        }}
      >
        <strong style={{ color: 'rgb(255, 180, 50)' }}>Use cases for forceOnchain:</strong>
        <ul style={{ margin: '0.5rem 0 0', paddingLeft: '1.25rem', color: colors.mutedForeground }}>
          <li>Verifying indexer accuracy against on-chain data</li>
          <li>Getting real-time prices when indexer may lag</li>
          <li>Debugging price discrepancies</li>
        </ul>
      </div>
    </div>
  )
}

export const ForceOnchain: Story = {
  name: '⛓ Force On-Chain Price',
  render: () => <ForceOnchainDemo selectedVault="WHYPE Prime" />,
  parameters: {
    docs: {
      description: {
        story: `
Demonstrates the \`forceOnchain\` option which bypasses the indexer and fetches price directly from the on-chain oracle.

**Key differences from "No Indexer":**
- The indexer is still configured and available
- Using \`forceOnchain: true\` explicitly skips it
- Useful for verifying prices or getting real-time on-chain data

**Flow with forceOnchain=true:**
1. Skip indexer check entirely
2. Fetch \`oracle()\`, \`unitOfAccount()\`, \`asset()\` from vault contract
3. Query price via \`oracle.getQuote()\`
4. Source shows "vaultOracle"
        `,
      },
    },
  },
}

export const StalePriceFallback: Story = {
  name: '📚 Stale Price Detection',
  render: () => {
    return (
      <div style={{ maxWidth: 600 }}>
        <h3 style={{ margin: '0 0 1rem', color: colors.foreground }}>
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
            color: colors.foreground,
          }}
        >
          <strong>Scenario:</strong> Indexer price is older than 15 minutes
        </div>

        <div
          style={{
            background: colors.muted,
            padding: '1rem',
            borderRadius: 8,
            border: `1px solid ${colors.border}`,
            marginBottom: '1rem',
          }}
        >
          <h4 style={{ margin: '0 0 0.5rem', fontSize: 14, color: colors.mutedForeground }}>
            How It Works
          </h4>
          <div style={{ fontSize: 13, color: colors.mutedForeground, lineHeight: 1.6 }}>
            <p>
              When <code>usePrice</code> receives price data from the indexer, it checks the{' '}
              <code>assetPriceTimestamp</code>:
            </p>

            <ol style={{ paddingLeft: '1.5rem', margin: '0.5rem 0' }}>
              <li>
                <strong>Fresh Price (&lt;15min):</strong> Use indexer price, source: "indexer"
              </li>
              <li>
                <strong>Stale Price (&gt;15min):</strong> Treat as null, fall back to on-chain oracle
              </li>
              <li>
                <strong>Missing Timestamp:</strong> Treat as stale, fall back to on-chain
              </li>
            </ol>
          </div>
        </div>

        <div
          style={{
            background: colors.muted,
            padding: '1rem',
            borderRadius: 8,
            border: `1px solid ${colors.border}`,
            marginBottom: '1rem',
          }}
        >
          <h4 style={{ margin: '0 0 0.5rem', fontSize: 14, color: colors.mutedForeground }}>
            Why 15 Minutes?
          </h4>
          <div style={{ fontSize: 13, color: colors.mutedForeground, lineHeight: 1.6 }}>
            <p>The 15-minute threshold balances:</p>
            <ul style={{ paddingLeft: '1.5rem', margin: '0.5rem 0' }}>
              <li>
                <strong>Freshness:</strong> Ensures current prices in volatile markets
              </li>
              <li>
                <strong>Reliability:</strong> Prevents excessive on-chain calls for minor delays
              </li>
            </ul>
          </div>
        </div>

        <div
          style={{
            background: 'rgba(142, 231, 194, 0.15)',
            border: '1px solid rgba(142, 231, 194, 0.3)',
            borderRadius: 8,
            padding: '0.75rem 1rem',
            fontSize: 13,
            color: colors.foreground,
          }}
        >
          <strong>✓ Result:</strong> Users always get reliable prices, even when indexer data is
          outdated
        </div>
      </div>
    )
  },
  parameters: {
    docs: {
      description: {
        story: `
Explains automatic fallback to on-chain pricing when indexer prices are stale (>15 minutes old).

**Implementation:**
Both \`useIndexerPrices\` and \`useIndexerVaultData\` check \`assetPriceTimestamp\` before returning prices.
This check happens transparently at the data layer, so all consuming hooks automatically benefit.
        `,
      },
    },
  },
}
