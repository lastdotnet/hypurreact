import type { Meta, StoryObj } from '@storybook/react'
import { useVaultInfo } from '../hooks/useVaultInfo'
import type { VaultCategory } from '../types/vaultInfo'
import { CATEGORY_PRESETS } from '../types/vaultInfo'

const DEMO_VAULT = '0xC200AaB602Cd7046389B5C8FB088884323F8dD0f' as const

const colors = {
  background: 'rgb(28, 28, 32)',
  panel: 'rgb(38, 38, 44)',
  muted: 'rgb(48, 48, 55)',
  foreground: 'rgb(250, 250, 252)',
  mutedForeground: 'rgb(145, 145, 160)',
  primary: 'rgb(142, 231, 194)',
  border: 'rgba(250, 250, 252, 0.05)',
  successBg: 'rgba(142, 231, 194, 0.15)',
  warningBg: 'rgba(255, 152, 0, 0.15)',
  gradientYellow: '#fbe572',
  gradientGreen: '#c2f4bc',
}

interface UseVaultInfoDemoProps {
  vaultAddress: string
  categories: VaultCategory[]
  forceOnchain: boolean
}

function UseVaultInfoDemo({ vaultAddress, categories, forceOnchain }: UseVaultInfoDemoProps) {
  const { data, isLoading, isError, error, source } = useVaultInfo({
    vaultAddress: vaultAddress as `0x${string}`,
    options: {
      include: categories as VaultCategory[],
      forceOnchain,
    },
  })

  return (
    <div style={{ maxWidth: 800 }}>
      <h3 style={{ margin: '0 0 1rem 0', color: colors.foreground }}>useVaultInfo Hook Demo</h3>

      <div
        style={{
          background: colors.muted,
          borderRadius: 8,
          padding: '1rem',
          marginBottom: '1rem',
          border: `1px solid ${colors.border}`,
        }}
      >
        <h4 style={{ margin: '0 0 0.5rem 0', color: colors.mutedForeground }}>Parameters</h4>
        <pre
          style={{
            margin: 0,
            background: colors.panel,
            padding: '0.75rem',
            borderRadius: 6,
            overflow: 'auto',
            fontSize: 12,
            fontFamily: "'DM Mono', monospace",
            color: colors.mutedForeground,
          }}
        >
          {JSON.stringify({ vaultAddress, categories, forceOnchain }, null, 2)}
        </pre>
      </div>

      <div
        style={{
          background: isError
            ? 'rgba(180, 70, 70, 0.15)'
            : isLoading
              ? colors.warningBg
              : colors.successBg,
          borderRadius: 12,
          padding: '1.25rem',
          border: `1px solid ${
            isError
              ? 'rgba(180, 70, 70, 0.3)'
              : isLoading
                ? 'rgba(255, 152, 0, 0.3)'
                : 'rgba(142, 231, 194, 0.3)'
          }`,
        }}
      >
        <h4 style={{ margin: '0 0 1rem 0', color: colors.mutedForeground }}>Result</h4>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '0.75rem',
          }}
        >
          <span style={{ fontWeight: 500, color: colors.mutedForeground }}>Status:</span>
          <span style={{ color: isLoading ? 'rgb(255, 152, 0)' : colors.primary }}>
            {isLoading ? 'Loading...' : 'Ready'}
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '0.75rem',
          }}
        >
          <span style={{ fontWeight: 500, color: colors.mutedForeground }}>Sources Used:</span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {source.indexer && (
              <div
                style={{
                  background: `linear-gradient(135deg, ${colors.gradientYellow} 0%, ${colors.gradientGreen} 100%)`,
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
                    color: colors.mutedForeground,
                    fontSize: 12,
                    fontWeight: 500,
                  }}
                >
                  Indexer
                </div>
              </div>
            )}
            {source.vaultLens && (
              <div
                style={{
                  background: `linear-gradient(135deg, ${colors.gradientYellow} 0%, ${colors.gradientGreen} 100%)`,
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
                    color: colors.mutedForeground,
                    fontSize: 12,
                    fontWeight: 500,
                  }}
                >
                  VaultLens
                </div>
              </div>
            )}
          </div>
        </div>

        {source.failedSources.length > 0 && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.75rem',
            }}
          >
            <span style={{ fontWeight: 500, color: colors.mutedForeground }}>Failed Sources:</span>
            <span style={{ color: 'rgb(180, 70, 70)' }}>{source.failedSources.join(', ')}</span>
          </div>
        )}

        {isError && error && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.75rem',
            }}
          >
            <span style={{ fontWeight: 500, color: colors.mutedForeground }}>Error:</span>
            <span style={{ color: 'rgb(180, 70, 70)' }}>{error.message}</span>
          </div>
        )}

        {data && (
          <div style={{ marginTop: '1rem' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', color: colors.mutedForeground }}>Data</h4>
            <pre
              style={{
                margin: 0,
                background: colors.panel,
                padding: '0.75rem',
                borderRadius: 6,
                overflow: 'auto',
                fontSize: 11,
                fontFamily: "'DM Mono', monospace",
                color: colors.mutedForeground,
                maxHeight: 400,
              }}
            >
              {JSON.stringify(
                data,
                (_, v) => (typeof v === 'bigint' ? v.toString() : v),
                2
              )}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}

const meta: Meta<typeof UseVaultInfoDemo> = {
  title: 'Hooks/useVaultInfo',
  component: UseVaultInfoDemo,
  tags: ['autodocs'],
  argTypes: {
    vaultAddress: {
      control: 'text',
      description: 'The vault address to fetch info for',
    },
    categories: {
      control: 'check',
      options: [
        'price',
        'identity',
        'financials',
        'apy',
        'caps',
        'collateral',
        'metadata',
        'irmConfig',
        'feeConfig',
        'liquidation',
        'hooks',
        'oracle',
      ],
      description: 'Categories of data to fetch',
    },
    forceOnchain: {
      control: 'boolean',
      description: 'Force fetching from VaultLens instead of indexer',
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const PriceOnly: Story = {
  name: 'Price Only (Indexer)',
  args: {
    vaultAddress: DEMO_VAULT,
    categories: ['price'],
    forceOnchain: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Fetches only price data. Uses indexer as primary source.',
      },
    },
  },
}

export const DashboardPreset: Story = {
  name: 'Dashboard Preset',
  args: {
    vaultAddress: DEMO_VAULT,
    categories: [...CATEGORY_PRESETS.dashboard],
    forceOnchain: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Fetches identity, price, financials, APY, and caps. Uses indexer as primary source.',
      },
    },
  },
}

export const WithOnchainConfig: Story = {
  name: 'With IRM Config (Indexer + VaultLens)',
  args: {
    vaultAddress: DEMO_VAULT,
    categories: ['price', 'identity', 'financials', 'irmConfig'],
    forceOnchain: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Fetches price/identity/financials from indexer, and IRM config from VaultLens. Demonstrates hybrid fetching.',
      },
    },
  },
}

export const ForceOnchain: Story = {
  name: 'Force VaultLens',
  args: {
    vaultAddress: DEMO_VAULT,
    categories: ['price', 'identity', 'financials'],
    forceOnchain: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Forces all data to be fetched from VaultLens, bypassing the indexer.',
      },
    },
  },
}

export const FullWithOnchain: Story = {
  name: 'Full Data (All Categories)',
  args: {
    vaultAddress: DEMO_VAULT,
    categories: [
      'price',
      'identity',
      'financials',
      'apy',
      'caps',
      'collateral',
      'metadata',
      'irmConfig',
      'feeConfig',
      'liquidation',
      'hooks',
      'oracle',
    ],
    forceOnchain: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Fetches all available data categories. Uses both indexer and VaultLens.',
      },
    },
  },
}
