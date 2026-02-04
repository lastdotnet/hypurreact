import type { Meta, StoryObj } from '@storybook/react'
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
