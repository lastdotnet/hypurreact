import type { Meta, StoryObj } from '@storybook/react'
import { useEarnVaultInfo } from '../hooks/useEarnVaultInfo'
import type { EarnVaultCategory } from '../types/earnVaultInfo'
import { EARN_CATEGORY_PRESETS, formatAPYPercent } from '..'

// Real Earn vault addresses on HyperEVM
const EARN_VAULTS = {
  USDT0: '0x6dd448d5cb73DC96788d5BE605DD3C5c83864a36',
  USDH: '0xF38eA9DE758a8F6be08B6E65bc0Ff2f3e3aB741b',
  WHYPE: '0xe8b10461ea0b04FF30F4cBfc3E93957Cac00DEd4',
  USDC: '0xF868A2B30854FE13e26F7AB7a92609cCb6b9c0e1',
} as const

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

interface UseEarnVaultInfoDemoProps {
  vaultAddress: string
  categories: EarnVaultCategory[]
  forceOnchain: boolean
}

function UseEarnVaultInfoDemo({ vaultAddress, categories, forceOnchain }: UseEarnVaultInfoDemoProps) {
  const { data, isLoading, isError, error, source } = useEarnVaultInfo({
    vaultAddress: vaultAddress as `0x${string}`,
    options: {
      include: categories as EarnVaultCategory[],
      forceOnchain,
    },
  })

  return (
    <div style={{ maxWidth: 900 }}>
      <h3 style={{ margin: '0 0 1rem 0', color: colors.foreground }}>useEarnVaultInfo Hook Demo</h3>

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
                  EarnVaultLens
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
          <>
            {/* APY Summary */}
            {categories.includes('apy') && (
              <div
                style={{
                  background: colors.panel,
                  borderRadius: 8,
                  padding: '1rem',
                  marginBottom: '1rem',
                }}
              >
                <h5 style={{ margin: '0 0 0.75rem 0', color: colors.foreground }}>APY Summary</h5>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: colors.mutedForeground, marginBottom: 4 }}>
                      Current
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 600, color: colors.primary }}>
                      {formatAPYPercent(data.apyCurrent ?? null)}
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: colors.mutedForeground, marginBottom: 4 }}>
                      7 Day
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 600, color: colors.foreground }}>
                      {formatAPYPercent(data.apy7d ?? null)}
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: colors.mutedForeground, marginBottom: 4 }}>
                      30 Day
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 600, color: colors.foreground }}>
                      {formatAPYPercent(data.apy30d ?? null)}
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: colors.mutedForeground, marginBottom: 4 }}>
                      90 Day
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 600, color: colors.foreground }}>
                      {formatAPYPercent(data.apy90d ?? null)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Strategies */}
            {categories.includes('strategies') && data.strategies && data.strategies.length > 0 && (
              <div
                style={{
                  background: colors.panel,
                  borderRadius: 8,
                  padding: '1rem',
                  marginBottom: '1rem',
                }}
              >
                <h5 style={{ margin: '0 0 0.75rem 0', color: colors.foreground }}>
                  Strategies ({data.strategies.length})
                </h5>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {data.strategies.map((strategy, idx) => (
                    <div
                      key={strategy.strategy}
                      style={{
                        background: colors.muted,
                        borderRadius: 6,
                        padding: '0.75rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 500, color: colors.foreground, fontSize: 13 }}>
                          {strategy.strategyVaultName || `Strategy ${idx + 1}`}
                        </div>
                        <div style={{ fontSize: 11, color: colors.mutedForeground, fontFamily: 'monospace' }}>
                          {strategy.strategy.slice(0, 10)}...{strategy.strategy.slice(-8)}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div
                          style={{
                            fontSize: 11,
                            padding: '2px 6px',
                            borderRadius: 4,
                            background:
                              strategy.status === 'active'
                                ? 'rgba(142, 231, 194, 0.2)'
                                : strategy.status === 'pending_removal'
                                  ? 'rgba(255, 152, 0, 0.2)'
                                  : 'rgba(180, 70, 70, 0.2)',
                            color:
                              strategy.status === 'active'
                                ? colors.primary
                                : strategy.status === 'pending_removal'
                                  ? 'rgb(255, 152, 0)'
                                  : 'rgb(180, 70, 70)',
                          }}
                        >
                          {strategy.status}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Raw Data */}
            <div style={{ marginTop: '1rem' }}>
              <h4 style={{ margin: '0 0 0.5rem 0', color: colors.mutedForeground }}>Raw Data</h4>
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
                  maxHeight: 300,
                }}
              >
                {JSON.stringify(data, (_, v) => (typeof v === 'bigint' ? v.toString() : v), 2)}
              </pre>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

const meta: Meta<typeof UseEarnVaultInfoDemo> = {
  title: 'Hooks/useEarnVaultInfo',
  component: UseEarnVaultInfoDemo,
  tags: ['autodocs'],
  argTypes: {
    vaultAddress: {
      control: 'select',
      options: Object.values(EARN_VAULTS),
      mapping: EARN_VAULTS,
      description: 'The Earn vault address to fetch info for',
    },
    categories: {
      control: 'check',
      options: ['identity', 'financials', 'apy', 'config', 'strategies'],
      description: 'Categories of data to fetch',
    },
    forceOnchain: {
      control: 'boolean',
      description: 'Force fetching from EarnVaultLens instead of indexer',
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const DashboardPreset: Story = {
  name: 'Dashboard (Identity + Financials + APY)',
  args: {
    vaultAddress: EARN_VAULTS.USDT0,
    categories: [...EARN_CATEGORY_PRESETS.dashboard],
    forceOnchain: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Fetches identity, financials, and APY data from the indexer.',
      },
    },
  },
}

export const FullData: Story = {
  name: 'Full Data (All Categories)',
  args: {
    vaultAddress: EARN_VAULTS.USDH,
    categories: [...EARN_CATEGORY_PRESETS.full],
    forceOnchain: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Fetches all available data categories including strategies.',
      },
    },
  },
}

export const APYComparison: Story = {
  name: 'APY Only',
  args: {
    vaultAddress: EARN_VAULTS.WHYPE,
    categories: ['apy', 'identity'],
    forceOnchain: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Fetches only APY data to compare with live values at mewler.hypurr.fi',
      },
    },
  },
}

export const StrategiesView: Story = {
  name: 'Strategies View',
  args: {
    vaultAddress: EARN_VAULTS.USDC,
    categories: ['identity', 'strategies'],
    forceOnchain: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows strategy allocations for the Earn vault.',
      },
    },
  },
}

export const ForceOnchain: Story = {
  name: 'Force EarnVaultLens',
  args: {
    vaultAddress: EARN_VAULTS.USDT0,
    categories: ['identity', 'financials'],
    forceOnchain: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Forces all data to be fetched from EarnVaultLens on-chain, bypassing the indexer.',
      },
    },
  },
}
