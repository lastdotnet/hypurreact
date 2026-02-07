import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import type { Address } from 'viem'
import { useVaults } from '../hooks/useVaults'
import { useVerifiedVaults } from '../hooks/useVerifiedVaults'
import { useVaultInfo } from '../hooks/useVaultInfo'

// Example vault addresses on HyperEVM
const ALL_VAULTS = [
  // Prime vaults
  '0xF73c654d468f5485bF15F3470B78851a49257704',
  '0x443100d1149D6d925Edb044248BBE32c5C7Ae955',
  '0x8A4545827DF5446Ba120B904e5306e58acCA4E89',
  '0xC200AaB602Cd7046389B5C8FB088884323F8dD0f',
  '0x28fCa2611d1Dd8109c26F748Cd2CF3BB4fC6D2cD',
  '0x83c34784e355ad2670dB77623B845273844FA480',
  // Yield vaults
  '0xc7e7861352df6919e7152C007832C48A777f2a4c',
  '0x97d30B40048bA3fC6b6628cE5E02E77f35B64fE0',
  '0x3403176f548400772c39E64564f2b148bcdFb65e',
  '0x64a3052570F5A1c241C6c8cd32F8F9aD411e6990',
  '0xF9BB65e113418292d1a3555515fBd64637a0BE18',
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
}

function VaultCard({ vaultAddress, isVerified }: { vaultAddress: Address; isVerified: boolean }) {
  const { data, isLoading } = useVaultInfo({
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
        {data?.supplyAPY !== undefined && data.supplyAPY !== null ? (
          <div style={{ color: colors.primary, fontWeight: 600 }}>{data.supplyAPY.toFixed(2)}% APY</div>
        ) : (
          <div style={{ color: colors.mutedForeground, fontSize: 12 }}>{isLoading ? 'Loading...' : '-'}</div>
        )}
      </div>
    </div>
  )
}

function UseVaultsDemo() {
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(false)

  const {
    data: verifiedVaultsList,
    isLoading: isVerifiedLoading,
    isConfigured,
    isError,
  } = useVerifiedVaults()

  const { vaults, count, verifiedSet, isLoading, verificationSource } = useVaults({
    vaults: ALL_VAULTS,
    verified: showVerifiedOnly,
  })

  return (
    <div style={{ maxWidth: 800 }}>
      <h3 style={{ margin: '0 0 1rem 0', color: colors.foreground }}>useVaults Hook Demo</h3>

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
                ? 'Loading verified vaults from governedPerspective...'
                : `GovernedPerspective configured - ${verifiedVaultsList?.length ?? 0} verified vaults`
              : 'GovernedPerspective not configured'}
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
              Filter to vaults in the governedPerspective verifiedArray
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
            Vaults ({count}/{ALL_VAULTS.length})
          </h4>
          {isLoading && (
            <span style={{ color: 'rgb(255, 152, 0)', fontSize: 12 }}>Loading verification data...</span>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {vaults.map(vaultAddress => (
            <VaultCard
              key={vaultAddress}
              vaultAddress={vaultAddress}
              isVerified={verifiedSet.has(vaultAddress.toLowerCase())}
            />
          ))}
          {vaults.length === 0 && (
            <div style={{ textAlign: 'center', color: colors.mutedForeground, padding: '2rem' }}>
              {showVerifiedOnly ? 'No verified vaults found' : 'No vaults to display'}
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
              verificationSource,
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
  title: 'Hooks/useVaults',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
Hook to filter vaults by verification status from the governedPerspective.

**Features:**
- Primary: Uses indexer \`perspectives\` array from /v2/vault/list (faster, no RPC)
- Fallback: On-chain \`verifiedArray()\` call when indexer unavailable
- 5-minute cache for on-chain verified vault list
- Toggle between all vaults and verified-only
- Case-insensitive address comparison
- Provides \`verifiedSet\` for external badge rendering
- Reports \`verificationSource\`: 'indexer' | 'onchain' | null

**Requirements:**
- \`governedPerspectiveAddress\` must be configured in VaultConfig
        `,
      },
    },
  },
}

export default meta

export const VerifiedFilter: StoryObj = {
  name: 'Verified Filter Demo',
  render: () => <UseVaultsDemo />,
  parameters: {
    docs: {
      description: {
        story: 'Interactive demo showing the verified filter toggle. Toggle to show only vaults in the governedPerspective verifiedArray.',
      },
    },
  },
}
