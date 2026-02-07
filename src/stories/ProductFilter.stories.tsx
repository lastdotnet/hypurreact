import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { useVaultInfo } from '../hooks/useVaultInfo'
import { useEarnVaultInfo } from '../hooks/useEarnVaultInfo'
import { useProductVaults, useVaultProduct } from '../hooks/useProductVaults'
import { useVaults } from '../hooks/useVaults'
import { useEarnVaults } from '../hooks/useEarnVaults'
import { useIndexerVaultList } from '../hooks/useIndexerVaultList'
import { useIndexerEarnVaultList } from '../hooks/useIndexerEarnVaultList'
import type { ProductId, ProductsConfig } from '../types/products'
import type { Address } from 'viem'

// Load products from euler-labels - MUST match lib/euler-labels/999/products.json exactly
const PRODUCTS: ProductsConfig = {
  'hypurrfi-earn': {
    name: 'HypurrFi Earn',
    description: 'Earn vaults curated by Clearstar for HypurrFi on HyperEVM.',
    entity: ['clearstar'],
    url: 'https://hypurr.fi/',
    vaults: [
      '0xF38eA9DE758a8F6be08B6E65bc0Ff2f3e3aB741b',
      '0xe8b10461ea0b04FF30F4cBfc3E93957Cac00DEd4',
      '0x6dd448d5cb73DC96788d5BE605DD3C5c83864a36',
      '0xF868A2B30854FE13e26F7AB7a92609cCb6b9c0e1',
    ] as Address[],
  },
  'hypurrfi-prime': {
    name: 'HypurrFi Prime',
    description: 'Fully cross-collateralized cluster for highly liquid assets.',
    entity: ['clearstar'],
    url: 'https://hypurr.fi/',
    vaults: [
      '0xF73c654d468f5485bF15F3470B78851a49257704',
      '0x443100d1149D6d925Edb044248BBE32c5C7Ae955',
      '0x8A4545827DF5446Ba120B904e5306e58acCA4E89',
      '0xC200AaB602Cd7046389B5C8FB088884323F8dD0f',
      '0x28fCa2611d1Dd8109c26F748Cd2CF3BB4fC6D2cD',
      '0x83c34784e355ad2670dB77623B845273844FA480',
    ] as Address[],
  },
  'hypurrfi-yield': {
    name: 'HypurrFi Yield',
    description: 'Yield-bearing HYPE leverage strategies, isolated from HypurrFi Prime Market.',
    entity: ['clearstar'],
    url: 'https://hypurr.fi/',
    vaults: [
      '0xc7e7861352df6919e7152C007832C48A777f2a4c',
      '0x97d30B40048bA3fC6b6628cE5E02E77f35B64fE0',
      '0x3403176f548400772c39E64564f2b148bcdFb65e',
      '0x64a3052570F5A1c241C6c8cd32F8F9aD411e6990',
      '0x1739105522e4fc9675f857C859223d24DFE7593C',
      '0xcAAA9A6e543b9af588Dce91E6c35Cb5fa1c7734C',
      '0x61Cb3b093b7125D593CCfa135C6e4E9D52D2e697',
      '0x06bf901Ce21450Bab46ceA74C4Bb6F07E6859CD6',
      '0x09a6ad87Eff280755BdF3E2C863358D27d81262D',
      '0x94F5C76A93F12057d73991AE5B4f70e9287b5b28',
      '0xF9BB65e113418292d1a3555515fBd64637a0BE18',
      '0xBb7DC37dbc108d40BcdD60403EF7bFDD6489071E',
    ] as Address[],
  },
}

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
  earnColor: '#fbe572',
  primeColor: '#c2f4bc',
  yieldColor: '#72b4fb',
  verifiedBadge: '#4ade80',
}

const productColors: Record<ProductId, string> = {
  'hypurrfi-earn': colors.earnColor,
  'hypurrfi-prime': colors.primeColor,
  'hypurrfi-yield': colors.yieldColor,
}

// Verified badge component
function VerifiedBadge() {
  return (
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
  )
}

interface ProductFilterDemoProps {
  productId: ProductId
}

function ProductFilterDemo({ productId }: ProductFilterDemoProps) {
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(false)

  const { vaults: allVaults, count: totalCount } = useProductVaults({
    products: PRODUCTS,
    productId,
  })

  const product = PRODUCTS[productId]
  const isEarnProduct = productId === 'hypurrfi-earn'

  // Get verification status based on product type
  const { vaults: filteredRegularVaults, verifiedSet: regularVerifiedSet, isPerspectiveConfigured: isRegularConfigured } = useVaults({
    vaults: allVaults,
    verified: showVerifiedOnly && !isEarnProduct,
  })

  const { vaults: filteredEarnVaults, verifiedSet: earnVerifiedSet, isPerspectiveConfigured: isEarnConfigured } = useEarnVaults({
    vaults: allVaults,
    verified: showVerifiedOnly && isEarnProduct,
  })

  // Use the appropriate filtered list based on product type
  const displayVaults = isEarnProduct ? filteredEarnVaults : filteredRegularVaults
  const verifiedSet = isEarnProduct ? earnVerifiedSet : regularVerifiedSet
  const isPerspectiveConfigured = isEarnProduct ? isEarnConfigured : isRegularConfigured

  return (
    <div style={{ maxWidth: 800 }}>
      <h3 style={{ margin: '0 0 1rem 0', color: colors.foreground }}>Product Filter Demo</h3>

      <div
        style={{
          background: colors.panel,
          borderRadius: 12,
          padding: '1.25rem',
          marginBottom: '1rem',
          border: `2px solid ${productColors[productId]}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              background: productColors[productId],
            }}
          />
          <h4 style={{ margin: 0, color: colors.foreground }}>{product.name}</h4>
          <span
            style={{
              background: colors.muted,
              color: colors.mutedForeground,
              padding: '2px 8px',
              borderRadius: 4,
              fontSize: 12,
            }}
          >
            {displayVaults.length}/{totalCount} vaults
          </span>
        </div>
        <p style={{ margin: 0, color: colors.mutedForeground, fontSize: 14 }}>{product.description}</p>
      </div>

      {/* Verified Filter Toggle */}
      <div
        style={{
          background: colors.panel,
          borderRadius: 8,
          padding: '0.75rem 1rem',
          marginBottom: '1rem',
          border: `1px solid ${colors.border}`,
        }}
      >
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={showVerifiedOnly}
            onChange={e => setShowVerifiedOnly(e.target.checked)}
            disabled={!isPerspectiveConfigured}
            style={{ width: 16, height: 16, cursor: 'pointer' }}
          />
          <div>
            <span style={{ color: colors.foreground, fontWeight: 500 }}>Show Verified Only</span>
            <span style={{ color: colors.mutedForeground, fontSize: 12, marginLeft: '0.5rem' }}>
              ({verifiedSet.size} verified in perspective)
            </span>
          </div>
        </label>
        {!isPerspectiveConfigured && (
          <div style={{ color: 'rgb(255, 152, 0)', fontSize: 11, marginTop: '0.5rem' }}>
            Perspective contract not configured
          </div>
        )}
      </div>

      <h4 style={{ margin: '0 0 1rem 0', color: colors.mutedForeground }}>Vaults in Product</h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {displayVaults.map(vaultAddress =>
          isEarnProduct ? (
            <EarnVaultCard
              key={vaultAddress}
              vaultAddress={vaultAddress}
              isVerified={verifiedSet.has(vaultAddress.toLowerCase())}
            />
          ) : (
            <VaultCard
              key={vaultAddress}
              vaultAddress={vaultAddress}
              productId={productId}
              isVerified={verifiedSet.has(vaultAddress.toLowerCase())}
            />
          ),
        )}
        {displayVaults.length === 0 && (
          <div style={{ textAlign: 'center', color: colors.mutedForeground, padding: '2rem' }}>
            {showVerifiedOnly ? 'No verified vaults found in this product' : 'No vaults to display'}
          </div>
        )}
      </div>
    </div>
  )
}

// Helper to format APY value
function formatApyValue(apy: number | null | undefined): string {
  if (apy === null || apy === undefined) return '-'
  return `${apy.toFixed(2)}%`
}

// Card for regular vaults (Prime, Yield) using useVaultInfo
function VaultCard({ vaultAddress, productId, isVerified }: { vaultAddress: Address; productId?: ProductId; isVerified?: boolean }) {
  const { data, isLoading, source } = useVaultInfo({
    vaultAddress,
    options: {
      include: ['identity', 'apy'] as const,
      // Only apply product filter when productId is specified
      ...(productId && { product: productId, products: PRODUCTS }),
    },
  })

  const hasIntrinsic = data?.intrinsicAPY !== null && data?.intrinsicAPY !== undefined && data.intrinsicAPY > 0
  const hasReward = data?.rewardAPY !== null && data?.rewardAPY !== undefined && data.rewardAPY > 0

  return (
    <div
      style={{
        background: colors.muted,
        borderRadius: 8,
        padding: '1rem',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 4 }}>
            <span style={{ fontWeight: 500, color: colors.foreground }}>
              {isLoading ? 'Loading...' : data?.assetSymbol || data?.vaultName || 'Unknown Vault'}
            </span>
            {isVerified && <VerifiedBadge />}
          </div>
          <div style={{ fontSize: 11, color: colors.mutedForeground }}>
            {isLoading ? '' : data?.vaultSymbol || vaultAddress.slice(0, 10) + '...' + vaultAddress.slice(-8)}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: colors.primary, fontWeight: 600, fontSize: 16 }}>
            {formatApyValue(data?.supplyAPY)} Total
          </div>
          <div style={{ fontSize: 11, color: colors.mutedForeground }}>
            via {source.indexer ? 'Indexer' : source.vaultLens ? 'VaultLens' : 'None'}
          </div>
        </div>
      </div>
      {/* APY breakdown */}
      {data && (
        <div
          style={{
            display: 'flex',
            gap: '1rem',
            marginTop: '0.75rem',
            paddingTop: '0.75rem',
            borderTop: `1px solid ${colors.border}`,
            fontSize: 12,
          }}
        >
          <div>
            <span style={{ color: colors.mutedForeground }}>Base: </span>
            <span style={{ color: colors.foreground }}>{formatApyValue(data.baseAPY)}</span>
          </div>
          {hasIntrinsic && (
            <div>
              <span style={{ color: colors.mutedForeground }}>Intrinsic: </span>
              <span style={{ color: '#72b4fb' }}>{formatApyValue(data.intrinsicAPY)}</span>
            </div>
          )}
          {hasReward && (
            <div>
              <span style={{ color: colors.mutedForeground }}>Rewards: </span>
              <span style={{ color: '#fbe572' }}>{formatApyValue(data.rewardAPY)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Card for Earn vaults using useEarnVaultInfo
function EarnVaultCard({ vaultAddress, isVerified }: { vaultAddress: Address; isVerified?: boolean }) {
  const { data, isLoading, source } = useEarnVaultInfo({
    vaultAddress,
    options: {
      include: ['identity', 'apy'] as const,
    },
  })

  // APY from indexer is already a percentage (e.g., 3.74 = 3.74%), don't multiply by 100
  const displayAPY = data?.apy7d !== undefined && data.apy7d !== null ? data.apy7d.toFixed(2) : null

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
          {isVerified && <VerifiedBadge />}
        </div>
        <div style={{ fontSize: 11, color: colors.mutedForeground, fontFamily: 'monospace' }}>
          {vaultAddress.slice(0, 10)}...{vaultAddress.slice(-8)}
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        {displayAPY !== null ? (
          <div style={{ color: colors.primary, fontWeight: 600 }}>{displayAPY}% APY (7d)</div>
        ) : (
          <div style={{ color: colors.mutedForeground, fontSize: 12 }}>
            {isLoading ? 'Loading...' : 'No APY'}
          </div>
        )}
        <div style={{ fontSize: 11, color: colors.mutedForeground }}>
          via {source.indexer ? 'Indexer' : source.vaultLens ? 'EarnVaultLens' : 'None'}
        </div>
      </div>
    </div>
  )
}

interface VaultProductCheckDemoProps {
  vaultAddress: string
}

function VaultProductCheckDemo({ vaultAddress }: VaultProductCheckDemoProps) {
  const { productId, isEarn, isPrime, isYield } = useVaultProduct({
    products: PRODUCTS,
    vaultAddress: vaultAddress as Address,
  })

  return (
    <div style={{ maxWidth: 600 }}>
      <h3 style={{ margin: '0 0 1rem 0', color: colors.foreground }}>Vault Product Check Demo</h3>

      <div
        style={{
          background: colors.muted,
          borderRadius: 8,
          padding: '1rem',
          marginBottom: '1rem',
          border: `1px solid ${colors.border}`,
        }}
      >
        <div style={{ fontSize: 11, color: colors.mutedForeground, marginBottom: 4 }}>Vault Address</div>
        <div style={{ fontFamily: 'monospace', color: colors.foreground, wordBreak: 'break-all' }}>
          {vaultAddress}
        </div>
      </div>

      <div
        style={{
          background: productId ? colors.successBg : colors.warningBg,
          borderRadius: 12,
          padding: '1.25rem',
          border: `1px solid ${productId ? 'rgba(142, 231, 194, 0.3)' : 'rgba(255, 152, 0, 0.3)'}`,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem',
          }}
        >
          <span style={{ fontWeight: 500, color: colors.mutedForeground }}>Product:</span>
          <span style={{ color: productId ? colors.foreground : 'rgb(255, 152, 0)' }}>
            {productId ? PRODUCTS[productId].name : 'Not in any product'}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <div
            style={{
              padding: '4px 10px',
              borderRadius: 6,
              background: isEarn ? colors.earnColor : colors.muted,
              color: isEarn ? 'rgb(15, 15, 17)' : colors.mutedForeground,
              fontSize: 12,
              fontWeight: 500,
            }}
          >
            Earn: {isEarn ? 'Yes' : 'No'}
          </div>
          <div
            style={{
              padding: '4px 10px',
              borderRadius: 6,
              background: isPrime ? colors.primeColor : colors.muted,
              color: isPrime ? 'rgb(15, 15, 17)' : colors.mutedForeground,
              fontSize: 12,
              fontWeight: 500,
            }}
          >
            Prime: {isPrime ? 'Yes' : 'No'}
          </div>
          <div
            style={{
              padding: '4px 10px',
              borderRadius: 6,
              background: isYield ? colors.yieldColor : colors.muted,
              color: isYield ? 'rgb(15, 15, 17)' : colors.mutedForeground,
              fontSize: 12,
              fontWeight: 500,
            }}
          >
            Yield: {isYield ? 'Yes' : 'No'}
          </div>
        </div>
      </div>
    </div>
  )
}

// Meta for ProductFilter stories
const meta: Meta<typeof ProductFilterDemo> = {
  title: 'Hooks/Product Filter',
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const EarnVaults: Story = {
  name: 'Earn Vaults',
  render: () => <ProductFilterDemo productId="hypurrfi-earn" />,
  parameters: {
    docs: {
      description: {
        story: 'Shows all 4 vaults in the HypurrFi Earn product using useEarnVaultInfo.',
      },
    },
  },
}

export const PrimeVaults: Story = {
  name: 'Prime Vaults',
  render: () => <ProductFilterDemo productId="hypurrfi-prime" />,
  parameters: {
    docs: {
      description: {
        story: 'Shows all 6 vaults in the HypurrFi Prime product.',
      },
    },
  },
}

export const YieldVaults: Story = {
  name: 'Yield Vaults',
  render: () => <ProductFilterDemo productId="hypurrfi-yield" />,
  parameters: {
    docs: {
      description: {
        story: 'Shows all 12 vaults in the HypurrFi Yield product.',
      },
    },
  },
}

export const VaultProductCheck: Story = {
  name: 'Vault Product Check',
  render: () => <VaultProductCheckDemo vaultAddress="0xF38eA9DE758a8F6be08B6E65bc0Ff2f3e3aB741b" />,
  parameters: {
    docs: {
      description: {
        story: 'Checks which product a vault belongs to.',
      },
    },
  },
}

export const VaultNotInProduct: Story = {
  name: 'Vault Not in Product',
  render: () => <VaultProductCheckDemo vaultAddress="0x0000000000000000000000000000000000000001" />,
  parameters: {
    docs: {
      description: {
        story: 'Shows the result when a vault is not in any product.',
      },
    },
  },
}

// ============================================================================
// All Vaults from Indexer (no product filter)
// ============================================================================

function AllEVKVaultsDemo() {
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(false)

  // Fetch all vaults from indexer - this also returns perspectives data
  const {
    vaults: indexerVaults,
    data: perspectivesMap,
    isLoading: isIndexerLoading,
    isError: isIndexerError,
  } = useIndexerVaultList()

  const allVaults = indexerVaults ?? []

  const { vaults, count, verifiedSet, verificationSource, isPerspectiveConfigured } = useVaults({
    vaults: allVaults,
    verified: showVerifiedOnly,
  })

  return (
    <div style={{ maxWidth: 900 }}>
      <h3 style={{ margin: '0 0 1rem 0', color: colors.foreground }}>All EVK Vaults (from Indexer)</h3>

      {/* Status Banner */}
      <div
        style={{
          background: isIndexerError ? colors.errorBg : colors.successBg,
          border: `1px solid ${isIndexerError ? 'rgba(180, 70, 70, 0.3)' : 'rgba(142, 231, 194, 0.3)'}`,
          borderRadius: 8,
          padding: '0.75rem 1rem',
          marginBottom: '1rem',
          fontSize: 13,
          color: colors.foreground,
        }}
      >
        {isIndexerLoading ? (
          'Loading vaults from indexer...'
        ) : isIndexerError ? (
          'Failed to load vaults from indexer'
        ) : (
          <>
            <strong>{allVaults.length}</strong> total vaults from /v2/vault/list
            {verificationSource && (
              <span style={{ marginLeft: '1rem', color: colors.mutedForeground }}>
                (verification via {verificationSource})
              </span>
            )}
          </>
        )}
      </div>

      {/* Verified Filter Toggle */}
      <div
        style={{
          background: showVerifiedOnly ? 'rgba(142, 231, 194, 0.1)' : colors.panel,
          borderRadius: 8,
          padding: '0.75rem 1rem',
          marginBottom: '1rem',
          border: `1px solid ${showVerifiedOnly ? 'rgba(142, 231, 194, 0.3)' : colors.border}`,
        }}
      >
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={showVerifiedOnly}
            onChange={e => setShowVerifiedOnly(e.target.checked)}
            disabled={!isPerspectiveConfigured}
            style={{ width: 16, height: 16, cursor: 'pointer' }}
          />
          <div>
            <span style={{ color: colors.foreground, fontWeight: 500 }}>Show Verified Only</span>
            <span style={{ color: colors.mutedForeground, fontSize: 12, marginLeft: '0.5rem' }}>
              ({verifiedSet.size} verified in governedPerspective)
            </span>
          </div>
        </label>
        {!isPerspectiveConfigured && (
          <div style={{ color: 'rgb(255, 152, 0)', fontSize: 11, marginTop: '0.5rem' }}>
            ⚠️ governedPerspectiveAddress not configured
          </div>
        )}
      </div>

      {/* Debug Info */}
      <div
        style={{
          background: colors.muted,
          borderRadius: 8,
          padding: '0.75rem 1rem',
          marginBottom: '1rem',
          fontSize: 12,
          fontFamily: "'DM Mono', monospace",
          color: colors.mutedForeground,
        }}
      >
        <div>Filter active: <strong style={{ color: showVerifiedOnly ? colors.primary : colors.foreground }}>{showVerifiedOnly ? 'YES' : 'NO'}</strong></div>
        <div>Perspective configured: {isPerspectiveConfigured ? '✓' : '✗'}</div>
        <div>Verification source: {verificationSource ?? 'none'}</div>
        <div>Perspectives map loaded: {perspectivesMap ? `✓ (${perspectivesMap.size} entries)` : '✗ (not loaded)'}</div>
        <div>Input vaults: {allVaults.length} | Verified set: {verifiedSet.size} | Displayed: {count}</div>
        <div style={{ marginTop: '0.5rem', color: showVerifiedOnly && count === allVaults.length ? 'rgb(180, 70, 70)' : colors.mutedForeground }}>
          {showVerifiedOnly && count === allVaults.length && verifiedSet.size > 0
            ? '⚠️ Filter not applied - verifiedSet has entries but count equals total'
            : showVerifiedOnly && verifiedSet.size === 0
            ? '⚠️ Verified set is empty - check perspectives data'
            : ''}
        </div>
      </div>

      {/* Vault List */}
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
            Vaults ({count}/{allVaults.length})
          </h4>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: 600, overflowY: 'auto' }}>
          {vaults.map(vaultAddress => (
            <VaultCard
              key={vaultAddress}
              vaultAddress={vaultAddress}
              isVerified={verifiedSet.has(vaultAddress.toLowerCase())}
            />
          ))}
          {vaults.length === 0 && !isIndexerLoading && (
            <div style={{ textAlign: 'center', color: colors.mutedForeground, padding: '2rem' }}>
              {showVerifiedOnly ? 'No verified vaults found' : 'No vaults to display'}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function AllEarnVaultsDemo() {
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(false)

  // Fetch all earn vaults from indexer
  const {
    vaults: indexerVaults,
    isLoading: isIndexerLoading,
    isError: isIndexerError,
  } = useIndexerEarnVaultList()

  const allVaults = indexerVaults ?? []

  const { vaults, count, verifiedSet, isPerspectiveConfigured } = useEarnVaults({
    vaults: allVaults,
    verified: showVerifiedOnly,
  })

  return (
    <div style={{ maxWidth: 900 }}>
      <h3 style={{ margin: '0 0 1rem 0', color: colors.foreground }}>All Earn Vaults (from Indexer)</h3>

      {/* Status Banner */}
      <div
        style={{
          background: isIndexerError ? colors.errorBg : colors.successBg,
          border: `1px solid ${isIndexerError ? 'rgba(180, 70, 70, 0.3)' : 'rgba(142, 231, 194, 0.3)'}`,
          borderRadius: 8,
          padding: '0.75rem 1rem',
          marginBottom: '1rem',
          fontSize: 13,
          color: colors.foreground,
        }}
      >
        {isIndexerLoading ? (
          'Loading earn vaults from indexer...'
        ) : isIndexerError ? (
          'Failed to load earn vaults from indexer'
        ) : (
          <>
            <strong>{allVaults.length}</strong> total earn vaults from /v1/earn/vaults
          </>
        )}
      </div>

      {/* Verified Filter Toggle */}
      <div
        style={{
          background: colors.panel,
          borderRadius: 8,
          padding: '0.75rem 1rem',
          marginBottom: '1rem',
          border: `1px solid ${colors.border}`,
        }}
      >
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={showVerifiedOnly}
            onChange={e => setShowVerifiedOnly(e.target.checked)}
            disabled={!isPerspectiveConfigured}
            style={{ width: 16, height: 16, cursor: 'pointer' }}
          />
          <div>
            <span style={{ color: colors.foreground, fontWeight: 500 }}>Show Verified Only</span>
            <span style={{ color: colors.mutedForeground, fontSize: 12, marginLeft: '0.5rem' }}>
              ({verifiedSet.size} verified in eulerEarnGovernedPerspective)
            </span>
          </div>
        </label>
      </div>

      {/* Vault List */}
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
            Earn Vaults ({count}/{allVaults.length})
          </h4>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: 600, overflowY: 'auto' }}>
          {vaults.map(vaultAddress => (
            <EarnVaultCard
              key={vaultAddress}
              vaultAddress={vaultAddress}
              isVerified={verifiedSet.has(vaultAddress.toLowerCase())}
            />
          ))}
          {vaults.length === 0 && !isIndexerLoading && (
            <div style={{ textAlign: 'center', color: colors.mutedForeground, padding: '2rem' }}>
              {showVerifiedOnly ? 'No verified earn vaults found' : 'No earn vaults to display'}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export const AllEVKVaults: Story = {
  name: 'All EVK Vaults (from Indexer)',
  render: () => <AllEVKVaultsDemo />,
  parameters: {
    docs: {
      description: {
        story: 'Shows all EVK vaults from the indexer /v2/vault/list endpoint. Toggle verified filter to see only vaults in the governedPerspective.',
      },
    },
  },
}

export const AllEarnVaults: Story = {
  name: 'All Earn Vaults (from Indexer)',
  render: () => <AllEarnVaultsDemo />,
  parameters: {
    docs: {
      description: {
        story: 'Shows all Earn vaults from the indexer /v1/earn/vaults endpoint (7 total). Toggle verified filter to see only vaults in the eulerEarnGovernedPerspective (4 verified).',
      },
    },
  },
}
