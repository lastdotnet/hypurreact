import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import type { Address } from 'viem'
import { useEarnVaults } from '../hooks/useEarnVaults'
import { useVerifiedEarnVaults } from '../hooks/useVerifiedEarnVaults'
import { useEarnVaultInfo } from '../hooks/useEarnVaultInfo'

// Example earn vault addresses on HyperEVM
const ALL_EARN_VAULTS = [
  '0xF38eA9DE758a8F6be08B6E65bc0Ff2f3e3aB741b',
  '0xe8b10461ea0b04FF30F4cBfc3E93957Cac00DEd4',
  '0x6dd448d5cb73DC96788d5BE605DD3C5c83864a36',
  '0xF868A2B30854FE13e26F7AB7a92609cCb6b9c0e1',
] as Address[]

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
  errorBg: 'rgba(180, 70, 70, 0.15)',
  verifiedBadge: '#4ade80',
  earnColor: '#fbe572',
}

function EarnVaultCard({ vaultAddress, isVerified }: { vaultAddress: Address; isVerified: boolean }) {
  const { data, isLoading } = useEarnVaultInfo({
    vaultAddress,
    options: { include: ['identity', 'apy'] as const },
  })

  return (
    <div
      style={{
        background: colors.muted,
        borderRadius: 8,
        padding: '1rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderLeft: `3px solid ${colors.earnColor}`,
      }}
    >
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 4 }}>
          <span style={{ fontWeight: 500, color: colors.foreground }}>
            {isLoading ? 'Loading...' : data?.vaultName || 'Unknown Vault'}
          </span>
          {isVerified && (
            <span
              style={{
                background: colors.verifiedBadge,
                color: 'rgb(15, 15, 17)',
                padding: '2px 6px',
                borderRadius: 4,
                fontSize: 10,
                fontWeight: 600,
              }}
            >
              VERIFIED
            </span>
          )}
        </div>
        <div style={{ fontSize: 11, color: colors.mutedForeground, fontFamily: 'monospace' }}>
          {vaultAddress.slice(0, 10)}...{vaultAddress.slice(-8)}
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        {data?.apy7d !== undefined && data.apy7d !== null ? (
          <div style={{ color: colors.primary, fontWeight: 600 }}>{data.apy7d.toFixed(2)}% APY (7d)</div>
        ) : (
          <div style={{ color: colors.mutedForeground, fontSize: 12 }}>{isLoading ? 'Loading...' : '-'}</div>
        )}
      </div>
    </div>
  )
}

function UseEarnVaultsDemo() {
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(false)

  const {
    data: verifiedVaultsList,
    isLoading: isVerifiedLoading,
    isConfigured,
    isError,
  } = useVerifiedEarnVaults()

  const { vaults, count, verifiedSet, isLoading } = useEarnVaults({
    vaults: ALL_EARN_VAULTS,
    verified: showVerifiedOnly,
  })

  return (
    <div style={{ maxWidth: 800 }}>
      <h3 style={{ margin: '0 0 1rem 0', color: colors.foreground }}>useEarnVaults Hook Demo</h3>

      {/* Perspective Status */}
      <div
        style={{
          background: isConfigured ? colors.successBg : colors.warningBg,
          border: `1px solid ${isConfigured ? 'rgba(142, 231, 194, 0.3)' : 'rgba(255, 152, 0, 0.3)'}`,
          borderRadius: 8,
          padding: '0.75rem 1rem',
          marginBottom: '1rem',
          fontSize: 13,
          color: colors.foreground,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: isConfigured ? colors.primary : 'rgb(255, 152, 0)',
            }}
          />
          <span>
            {isConfigured
              ? isVerifiedLoading
                ? 'Loading verified vaults from eulerEarnGovernedPerspective...'
                : `EulerEarnGovernedPerspective configured - ${verifiedVaultsList?.length ?? 0} verified earn vaults`
              : 'EulerEarnGovernedPerspective not configured'}
          </span>
        </div>
        {isError && (
          <div style={{ color: 'rgb(180, 70, 70)', marginTop: '0.5rem', fontSize: 12 }}>
            Error loading verified vaults
          </div>
        )}
      </div>

      {/* Filter Toggle */}
      <div
        style={{
          background: colors.panel,
          borderRadius: 8,
          padding: '1rem',
          marginBottom: '1rem',
          border: `1px solid ${colors.border}`,
        }}
      >
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={showVerifiedOnly}
            onChange={e => setShowVerifiedOnly(e.target.checked)}
            disabled={!isConfigured}
            style={{ width: 18, height: 18, cursor: 'pointer' }}
          />
          <div>
            <div style={{ color: colors.foreground, fontWeight: 500 }}>Show Verified Only</div>
            <div style={{ color: colors.mutedForeground, fontSize: 12 }}>
              Filter to vaults in the eulerEarnGovernedPerspective verifiedArray
            </div>
          </div>
        </label>
      </div>

      {/* Results */}
      <div
        style={{
          background: colors.panel,
          borderRadius: 12,
          padding: '1.25rem',
          border: `1px solid ${colors.border}`,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h4 style={{ margin: 0, color: colors.foreground }}>
            Earn Vaults ({count}/{ALL_EARN_VAULTS.length})
          </h4>
          {isLoading && (
            <span style={{ color: 'rgb(255, 152, 0)', fontSize: 12 }}>Loading verification data...</span>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {vaults.map(vaultAddress => (
            <EarnVaultCard
              key={vaultAddress}
              vaultAddress={vaultAddress}
              isVerified={verifiedSet.has(vaultAddress.toLowerCase())}
            />
          ))}
          {vaults.length === 0 && (
            <div style={{ textAlign: 'center', color: colors.mutedForeground, padding: '2rem' }}>
              {showVerifiedOnly ? 'No verified earn vaults found' : 'No vaults to display'}
            </div>
          )}
        </div>
      </div>

      {/* Raw Data */}
      <div style={{ marginTop: '1.5rem' }}>
        <h4 style={{ margin: '0 0 0.5rem 0', color: colors.mutedForeground }}>Hook Return Value</h4>
        <pre
          style={{
            margin: 0,
            background: colors.muted,
            padding: '0.75rem',
            borderRadius: 6,
            overflow: 'auto',
            fontSize: 11,
            fontFamily: "'DM Mono', monospace",
            color: colors.mutedForeground,
            maxHeight: 200,
          }}
        >
          {JSON.stringify(
            {
              count,
              isVerifiedFilter: showVerifiedOnly,
              isLoading,
              isPerspectiveConfigured: isConfigured,
              verifiedSetSize: verifiedSet.size,
            },
            null,
            2,
          )}
        </pre>
      </div>
    </div>
  )
}

const meta: Meta = {
  title: 'Hooks/useEarnVaults',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
Hook to filter earn vaults by verification status from the eulerEarnGovernedPerspective contract.

**Features:**
- Fetch verified earn vault array from eulerEarnGovernedPerspective.verifiedArray()
- 5-minute cache for verified vault list
- Toggle between all vaults and verified-only
- Case-insensitive address comparison
- Provides verifiedSet for external badge rendering

**Requirements:**
- \`eulerEarnGovernedPerspectiveAddress\` must be configured in VaultConfig
        `,
      },
    },
  },
}

export default meta

export const VerifiedFilter: StoryObj = {
  name: 'Verified Filter Demo',
  render: () => <UseEarnVaultsDemo />,
  parameters: {
    docs: {
      description: {
        story: 'Interactive demo showing the verified filter toggle for Earn vaults. Toggle to show only vaults in the eulerEarnGovernedPerspective verifiedArray.',
      },
    },
  },
}
