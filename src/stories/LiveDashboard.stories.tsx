import type { Meta, StoryObj } from '@storybook/react'
import * as React from 'react'
import { usePrice } from '../hooks/usePrice'
import { useIndexerPrices } from '../hooks/useIndexerPrices'

const VAULTS = {
  USDC: {
    address: '0xC200AaB602Cd7046389B5C8FB088884323F8dD0f' as const,
    name: 'USDC Vault',
    symbol: 'USDC',
    color: '#2775ca',
  },
  WHYPE: {
    address: '0xF73c654d468f5485bF15F3470B78851a49257704' as const,
    name: 'WHYPE Vault',
    symbol: 'WHYPE',
    color: '#00d395',
  },
  UBTC: {
    address: '0x8A4545827DF5446Ba120B904e5306e58acCA4E89' as const,
    name: 'UBTC Vault',
    symbol: 'UBTC',
    color: '#f7931a',
  },
}

function VaultPriceCard({ vault }: { vault: (typeof VAULTS)[keyof typeof VAULTS] }) {
  const { priceUSD, isLoading, isError, source } = usePrice({
    vaultAddress: vault.address,
    enabled: true,
  })

  return (
    <div
      style={{
        background: 'rgb(38, 38, 44)',
        borderRadius: 16,
        padding: '1.25rem',
        boxShadow: '0px 7px 16px -4px rgba(0, 0, 0, 0.45)',
        border: '1px solid rgba(250, 250, 252, 0.05)',
        minWidth: 200,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: vault.color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 700,
            fontSize: 14,
          }}
        >
          {vault.symbol.slice(0, 2)}
        </div>
        <div>
          <div style={{ fontWeight: 600, fontSize: 16, color: 'rgb(250, 250, 252)' }}>{vault.symbol}</div>
          <div style={{ fontSize: 12, color: 'rgb(145, 145, 160)' }}>{vault.name}</div>
        </div>
      </div>

      {isLoading ? (
        <div style={{ height: 48, display: 'flex', alignItems: 'center' }}>
          <div
            style={{
              width: 20,
              height: 20,
              border: '2px solid rgba(250, 250, 252, 0.1)',
              borderTopColor: vault.color,
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }}
          />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : isError ? (
        <div style={{ color: 'rgb(180, 70, 70)', fontSize: 14 }}>Failed to load price</div>
      ) : (
        <>
          <div style={{ fontSize: 28, fontWeight: 700, fontFamily: "'DM Mono', monospace", color: 'rgb(250, 250, 252)' }}>
            ${priceUSD < 1 ? priceUSD.toFixed(6) : priceUSD < 100 ? priceUSD.toFixed(4) : priceUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div
            style={{
              marginTop: '0.5rem',
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
              {source === 'indexer' ? 'Indexer' : source === 'vaultOracle' ? 'On-Chain Oracle' : 'No Data'}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function IndexerStatus() {
  const { data, isLoading, isError, isSuccess } = useIndexerPrices()
  const vaultCount = data ? Object.keys(data).length : 0

  return (
    <div
      style={{
        background: isError ? 'rgba(180, 70, 70, 0.15)' : isLoading ? 'rgba(255, 152, 0, 0.15)' : 'rgba(142, 231, 194, 0.15)',
        border: `1px solid ${isError ? 'rgba(180, 70, 70, 0.3)' : isLoading ? 'rgba(255, 152, 0, 0.3)' : 'rgba(142, 231, 194, 0.3)'}`,
        borderRadius: 8,
        padding: '0.75rem 1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        fontSize: 14,
        color: 'rgb(250, 250, 252)',
      }}
    >
      <div
        style={{
          width: 10,
          height: 10,
          borderRadius: '50%',
          background: isError ? 'rgb(180, 70, 70)' : isLoading ? '#ff9800' : 'rgb(142, 231, 194)',
        }}
      />
      <div>
        {isLoading && 'Connecting to indexer...'}
        {isError && 'Indexer connection failed - using on-chain fallback'}
        {isSuccess && `Indexer connected - ${vaultCount} vaults cached`}
      </div>
    </div>
  )
}

function LiveDashboard() {
  const [lastUpdate, setLastUpdate] = React.useState(new Date())

  React.useEffect(() => {
    const interval = setInterval(() => setLastUpdate(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div style={{ maxWidth: 900 }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ margin: '0 0 0.5rem', fontSize: 24, color: 'rgb(250, 250, 252)' }}>HyperEVM Vault Prices</h2>
        <p style={{ margin: 0, color: 'rgb(145, 145, 160)', fontSize: 14 }}>
          Live prices from indexer with on-chain oracle fallback
        </p>
      </div>

      <IndexerStatus />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '1.5rem',
          marginTop: '1.5rem',
        }}
      >
        {Object.values(VAULTS).map((vault) => (
          <VaultPriceCard key={vault.address} vault={vault} />
        ))}
      </div>

      <div style={{ marginTop: '1.5rem', fontSize: 12, color: 'rgb(145, 145, 160)', textAlign: 'center' }}>
        Last checked: {lastUpdate.toLocaleTimeString()} | Chain ID: 999 (HyperEVM)
      </div>
    </div>
  )
}

function SingleVaultDemo({ vaultKey }: { vaultKey: keyof typeof VAULTS }) {
  const vault = VAULTS[vaultKey]
  const { priceUSD, isLoading, isError, error, source } = usePrice({
    vaultAddress: vault.address,
    enabled: true,
  })

  return (
    <div style={{ maxWidth: 400 }}>
      <h3 style={{ margin: '0 0 1rem', color: 'rgb(250, 250, 252)' }}>{vault.name} Price</h3>

      <div
        style={{
          background: 'rgb(38, 38, 44)',
          borderRadius: 16,
          padding: '1.5rem',
          boxShadow: '0px 7px 16px -4px rgba(0, 0, 0, 0.45)',
          border: '1px solid rgba(250, 250, 252, 0.05)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: vault.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 700,
              fontSize: 20,
            }}
          >
            {vault.symbol.slice(0, 2)}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 20, color: 'rgb(250, 250, 252)' }}>{vault.symbol}</div>
            <div style={{ fontSize: 14, color: 'rgb(145, 145, 160)' }}>{vault.name}</div>
          </div>
        </div>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div
              style={{
                width: 32,
                height: 32,
                border: '3px solid rgba(250, 250, 252, 0.1)',
                borderTopColor: vault.color,
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto',
              }}
            />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <p style={{ marginTop: '1rem', color: 'rgb(145, 145, 160)' }}>Loading price...</p>
          </div>
        ) : isError ? (
          <div
            style={{
              background: 'rgba(180, 70, 70, 0.15)',
              border: '1px solid rgba(180, 70, 70, 0.3)',
              borderRadius: 8,
              padding: '1rem',
              color: 'rgb(180, 70, 70)',
            }}
          >
            <strong>Error:</strong> {error?.message || 'Failed to fetch price'}
          </div>
        ) : (
          <>
            <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
              <div style={{ fontSize: 14, color: 'rgb(145, 145, 160)', marginBottom: '0.25rem' }}>Current Price</div>
              <div style={{ fontSize: 36, fontWeight: 700, fontFamily: "'DM Mono', monospace", color: 'rgb(250, 250, 252)' }}>
                ${priceUSD < 1 ? priceUSD.toFixed(8) : priceUSD < 100 ? priceUSD.toFixed(4) : priceUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '0.5rem',
                marginTop: '1rem',
              }}
            >
              <div
                style={{
                  background: 'linear-gradient(135deg, #fbe572 0%, #c2f4bc 100%)',
                  padding: 1,
                  borderRadius: 12,
                  display: 'inline-block',
                }}
              >
                <div
                  style={{
                    background: 'rgb(15, 15, 17)',
                    borderRadius: 11,
                    padding: '4px 12px',
                    color: 'rgb(145, 145, 160)',
                    fontSize: 12,
                    fontWeight: 500,
                  }}
                >
                  {source === 'indexer' ? 'From Indexer' : source === 'vaultOracle' ? 'From On-Chain Oracle' : 'No Data'}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <div style={{ marginTop: '1rem', fontSize: 12, color: 'rgb(145, 145, 160)' }}>
        Vault: <code style={{ background: 'rgb(48, 48, 55)', padding: '2px 6px', borderRadius: 4, color: 'rgb(250, 250, 252)' }}>{vault.address}</code>
      </div>
    </div>
  )
}

const meta: Meta = {
  title: 'Examples/Live Dashboard',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
Live dashboard demonstrating real vault prices from HyperEVM.

This example shows:
- **Automatic indexer fetching** - Prices are fetched from the indexer API
- **On-chain fallback** - Falls back to oracle contracts when indexer unavailable
- **Source indication** - Shows whether price came from indexer or on-chain
- **Multiple vaults** - Displays prices for USDC, WHYPE, UBTC, WETH, and PURR vaults

The indexer URL is configured in the VaultProvider:
\`\`\`ts
const config = createVaultConfig({
  chainId: 999,
  indexerUrl: 'https://indexer-hyperevm-api-prod.up.railway.app',
  // ...
})
\`\`\`
        `,
      },
    },
  },
}

export default meta

export const Dashboard: StoryObj = {
  name: 'Multi-Vault Dashboard',
  render: () => <LiveDashboard />,
  parameters: {
    docs: {
      description: {
        story: 'A dashboard showing live prices for multiple HyperEVM vaults. Prices are fetched from the indexer with on-chain oracle as fallback.',
      },
    },
  },
}

export const USDCVault: StoryObj = {
  name: 'USDC Vault Detail',
  render: () => <SingleVaultDemo vaultKey="USDC" />,
  parameters: {
    docs: {
      description: {
        story: 'Detailed view of the USDC vault price with source indication.',
      },
    },
  },
}

export const WHYPEVault: StoryObj = {
  name: 'WHYPE Vault Detail',
  render: () => <SingleVaultDemo vaultKey="WHYPE" />,
  parameters: {
    docs: {
      description: {
        story: 'Detailed view of the WHYPE (wrapped HYPE) vault price.',
      },
    },
  },
}

export const UBTCVault: StoryObj = {
  name: 'UBTC Vault Detail',
  render: () => <SingleVaultDemo vaultKey="UBTC" />,
  parameters: {
    docs: {
      description: {
        story: 'Detailed view of the UBTC vault price.',
      },
    },
  },
}
