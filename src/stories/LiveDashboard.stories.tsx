import type { Meta, StoryObj } from '@storybook/react'
import * as React from 'react'
import { useState } from 'react'
import { useVaultInfo } from '../hooks/useVaultInfo'
import { useEarnVaultInfo } from '../hooks/useEarnVaultInfo'
import { useIndexerPrices } from '../hooks/useIndexerPrices'
import { useVaults } from '../hooks/useVaults'
import { useEarnVaults } from '../hooks/useEarnVaults'
import { useVerifiedVaults } from '../hooks/useVerifiedVaults'
import { useVerifiedEarnVaults } from '../hooks/useVerifiedEarnVaults'
import { formatAPYPercent } from '../utils/earnApyUtils'
import type { Address } from 'viem'
import type { ProductId } from '../types/products'

const colors = {
  background: 'rgb(28, 28, 32)',
  panel: 'rgb(38, 38, 44)',
  muted: 'rgb(48, 48, 55)',
  foreground: 'rgb(250, 250, 252)',
  mutedForeground: 'rgb(145, 145, 160)',
  primary: 'rgb(142, 231, 194)',
  border: 'rgba(250, 250, 252, 0.05)',
  error: 'rgb(180, 70, 70)',
  warning: '#ff9800',
  earnColor: '#fbe572',
  primeColor: '#c2f4bc',
  yieldColor: '#72b4fb',
  verifiedBadge: '#4ade80',
}

// Example vaults from each product
const PRODUCT_VAULTS = {
  // EARN product examples
  'earn-usdh': {
    address: '0xF38eA9DE758a8F6be08B6E65bc0Ff2f3e3aB741b' as Address,
    name: 'USDH Earn Vault',
    symbol: 'USDH',
    product: 'hypurrfi-earn' as ProductId,
    color: colors.earnColor,
  },
  'earn-usdc': {
    address: '0xF868A2B30854FE13e26F7AB7a92609cCb6b9c0e1' as Address,
    name: 'USDC Earn Vault',
    symbol: 'USDC',
    product: 'hypurrfi-earn' as ProductId,
    color: colors.earnColor,
  },
  // PRIME product examples
  'prime-whype': {
    address: '0xF73c654d468f5485bF15F3470B78851a49257704' as Address,
    name: 'WHYPE Prime Vault',
    symbol: 'WHYPE',
    product: 'hypurrfi-prime' as ProductId,
    color: colors.primeColor,
  },
  'prime-khype': {
    address: '0x443100d1149D6d925Edb044248BBE32c5C7Ae955' as Address,
    name: 'kHYPE Prime Vault',
    symbol: 'kHYPE',
    product: 'hypurrfi-prime' as ProductId,
    color: colors.primeColor,
  },
  'prime-usdt': {
    address: '0x28fCa2611d1Dd8109c26F748Cd2CF3BB4fC6D2cD' as Address,
    name: 'USDT0 Prime Vault',
    symbol: 'USDT0',
    product: 'hypurrfi-prime' as ProductId,
    color: colors.primeColor,
  },
  // YIELD product examples
  'yield-whype': {
    address: '0xc7e7861352df6919e7152C007832C48A777f2a4c' as Address,
    name: 'WHYPE Yield Vault',
    symbol: 'WHYPE',
    product: 'hypurrfi-yield' as ProductId,
    color: colors.yieldColor,
  },
  'yield-khype': {
    address: '0x97d30B40048bA3fC6b6628cE5E02E77f35B64fE0' as Address,
    name: 'kHYPE Yield Vault',
    symbol: 'kHYPE',
    product: 'hypurrfi-yield' as ProductId,
    color: colors.yieldColor,
  },
  'yield-usdc': {
    address: '0xF9BB65e113418292d1a3555515fBd64637a0BE18' as Address,
    name: 'USDC Yield Vault',
    symbol: 'USDC',
    product: 'hypurrfi-yield' as ProductId,
    color: colors.yieldColor,
  },
}

type VaultKey = keyof typeof PRODUCT_VAULTS

function formatBigInt(value: bigint | null | undefined, decimals = 18): string {
  if (value === null || value === undefined) return '-'
  const num = Number(value) / Math.pow(10, decimals)
  if (num < 0.01 && num > 0) return num.toExponential(2)
  return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatUSD(value: number | null | undefined): string {
  if (value === null || value === undefined) return '-'
  return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// Use formatAPYPercent from utils - indexer returns APY as percentages (5.25 = 5.25%)

function formatAddress(addr: Address | string | null | undefined): string {
  if (!addr) return '-'
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

// Badge component for product identification
function ProductBadge({ product }: { product: ProductId }) {
  const productColors: Record<ProductId, string> = {
    'hypurrfi-earn': colors.earnColor,
    'hypurrfi-prime': colors.primeColor,
    'hypurrfi-yield': colors.yieldColor,
  }
  const productNames: Record<ProductId, string> = {
    'hypurrfi-earn': 'Earn',
    'hypurrfi-prime': 'Prime',
    'hypurrfi-yield': 'Yield',
  }
  return (
    <span
      style={{
        background: productColors[product],
        color: 'rgb(15, 15, 17)',
        padding: '2px 8px',
        borderRadius: 4,
        fontSize: 11,
        fontWeight: 600,
      }}
    >
      {productNames[product]}
    </span>
  )
}

// Badge component for verified status
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

// Data row component for detail views
function DataRow({ label, value, highlight }: { label: string; value: React.ReactNode; highlight?: boolean }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: '0.5rem 0',
        borderBottom: `1px solid ${colors.border}`,
      }}
    >
      <span style={{ color: colors.mutedForeground, fontSize: 13 }}>{label}</span>
      <span style={{ color: highlight ? colors.primary : colors.foreground, fontSize: 13, fontWeight: highlight ? 600 : 400 }}>
        {value}
      </span>
    </div>
  )
}

// Section component
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <h4 style={{ color: colors.foreground, margin: '0 0 0.75rem', fontSize: 14, fontWeight: 600 }}>{title}</h4>
      <div style={{ background: colors.muted, borderRadius: 8, padding: '0.5rem 1rem' }}>{children}</div>
    </div>
  )
}

// Card for dashboard overview
function VaultOverviewCard({ vaultKey, isVerified }: { vaultKey: VaultKey; isVerified?: boolean }) {
  const vault = PRODUCT_VAULTS[vaultKey]
  const isEarn = vault.product === 'hypurrfi-earn'

  const regularVault = useVaultInfo({
    vaultAddress: vault.address,
    options: { include: ['identity', 'apy', 'financials'] as const },
    enabled: !isEarn,
  })

  const earnVault = useEarnVaultInfo({
    vaultAddress: vault.address,
    options: { include: ['identity', 'apy', 'financials'] as const },
    enabled: isEarn,
  })

  const { data, isLoading, source } = isEarn ? earnVault : regularVault

  const totalAPY = isEarn ? (data as any)?.apy7d : (data as any)?.supplyAPY
  const tvl = (data as any)?.totalAssetsUSD

  return (
    <div
      style={{
        background: colors.panel,
        borderRadius: 12,
        padding: '1rem',
        border: `1px solid ${colors.border}`,
        borderLeft: `3px solid ${vault.color}`,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 4 }}>
            <span style={{ fontWeight: 600, color: colors.foreground }}>
              {isLoading ? 'Loading...' : data?.vaultName || vault.name}
            </span>
            {isVerified && <VerifiedBadge />}
          </div>
          <ProductBadge product={vault.product} />
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: colors.primary, fontWeight: 700, fontSize: 18 }}>{formatAPYPercent(totalAPY)}</div>
          <div style={{ fontSize: 11, color: colors.mutedForeground }}>
            {isEarn ? '7d APY' : 'Supply APY'}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
        <span style={{ color: colors.mutedForeground }}>TVL: {formatUSD(tvl)}</span>
        <span style={{ color: colors.mutedForeground }}>
          via {source.indexer ? 'Indexer' : source.vaultLens ? 'VaultLens' : 'None'}
        </span>
      </div>
    </div>
  )
}

// Detailed view for Prime/Yield vaults
function VaultDetailView({ vaultKey }: { vaultKey: VaultKey }) {
  const vault = PRODUCT_VAULTS[vaultKey]

  const { data, isLoading, isError, error, source } = useVaultInfo({
    vaultAddress: vault.address,
    options: { include: ['identity', 'price', 'financials', 'apy', 'caps', 'collateral', 'metadata'] as const },
  })

  if (isLoading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: colors.mutedForeground }}>
        Loading vault data...
      </div>
    )
  }

  if (isError) {
    return (
      <div style={{ padding: '1rem', background: 'rgba(180, 70, 70, 0.15)', borderRadius: 8, color: colors.error }}>
        Error: {error?.message || 'Failed to load vault data'}
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 800 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ margin: 0, color: colors.foreground }}>{data?.vaultName || vault.name}</h2>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', alignItems: 'center' }}>
            <ProductBadge product={vault.product} />
            <span style={{ fontSize: 12, color: colors.mutedForeground, fontFamily: 'monospace' }}>
              {vault.address}
            </span>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: colors.primary, fontSize: 28, fontWeight: 700 }}>{formatAPYPercent(data?.supplyAPY)}</div>
          <div style={{ fontSize: 12, color: colors.mutedForeground }}>Total Supply APY</div>
        </div>
      </div>

      {/* Source indicator */}
      <div
        style={{
          background: colors.muted,
          borderRadius: 8,
          padding: '0.75rem 1rem',
          marginBottom: '1.5rem',
          fontSize: 12,
          color: colors.mutedForeground,
        }}
      >
        Data sources: {source.categoriesFromIndexer.length > 0 && `Indexer (${source.categoriesFromIndexer.join(', ')})`}
        {source.categoriesFromVaultLens.length > 0 && ` | VaultLens (${source.categoriesFromVaultLens.join(', ')})`}
        {source.failedSources.length > 0 && <span style={{ color: colors.error }}> | Failed: {source.failedSources.join(', ')}</span>}
      </div>

      {/* Identity */}
      <Section title="Identity">
        <DataRow label="Vault Address" value={<code style={{ fontSize: 11 }}>{data?.vault}</code>} />
        <DataRow label="Vault Symbol" value={data?.vaultSymbol} />
        <DataRow label="Vault Decimals" value={data?.vaultDecimals} />
        <DataRow label="Asset Address" value={<code style={{ fontSize: 11 }}>{data?.asset}</code>} />
        <DataRow label="Asset Symbol" value={data?.assetSymbol} />
        <DataRow label="Asset Decimals" value={data?.assetDecimals} />
      </Section>

      {/* Price */}
      <Section title="Price">
        <DataRow label="Asset Price (USD)" value={formatUSD(data?.assetPrice)} highlight />
        <DataRow label="Price Timestamp" value={data?.assetPriceTimestamp || '-'} />
      </Section>

      {/* APY Breakdown */}
      <Section title="APY Breakdown">
        <DataRow label="Total Supply APY" value={formatAPYPercent(data?.supplyAPY)} highlight />
        <DataRow label="Base APY" value={formatAPYPercent(data?.baseAPY)} />
        <DataRow label="Intrinsic APY" value={formatAPYPercent(data?.intrinsicAPY)} />
        <DataRow label="Reward APY" value={formatAPYPercent(data?.rewardAPY)} />
        <DataRow label="Borrow APY" value={formatAPYPercent(data?.borrowAPY)} />
      </Section>

      {/* Financials */}
      <Section title="Financials">
        <DataRow label="Total Assets" value={formatBigInt(data?.totalAssets, data?.assetDecimals || 18)} />
        <DataRow label="Total Assets (USD)" value={formatUSD(data?.totalAssetsUSD)} highlight />
        <DataRow label="Total Borrows" value={formatBigInt(data?.totalBorrows, data?.assetDecimals || 18)} />
        <DataRow label="Cash" value={formatBigInt(data?.cash, data?.assetDecimals || 18)} />
        <DataRow label="Cash (USD)" value={formatUSD(data?.cashUSD)} />
        <DataRow label="Total Shares" value={formatBigInt(data?.totalShares, data?.vaultDecimals || 18)} />
        <DataRow label="Utilization" value={data?.utilization !== undefined ? `${(data.utilization * 100).toFixed(2)}%` : '-'} />
      </Section>

      {/* Caps */}
      <Section title="Caps">
        <DataRow label="Supply Cap" value={formatBigInt(data?.supplyCap, data?.assetDecimals || 18)} />
        <DataRow label="Borrow Cap" value={formatBigInt(data?.borrowCap, data?.assetDecimals || 18)} />
        <DataRow label="Supply Cap %" value={data?.supplyCapPercentage !== null ? `${data?.supplyCapPercentage?.toFixed(2)}%` : '-'} />
      </Section>

      {/* Collateral */}
      {data?.collateralLTVs && data.collateralLTVs.length > 0 && (
        <Section title={`Collateral LTVs (${data.collateralLTVs.length})`}>
          {data.collateralLTVs.map((ltv, idx) => (
            <div key={idx} style={{ padding: '0.5rem 0', borderBottom: `1px solid ${colors.border}` }}>
              <div style={{ fontSize: 11, color: colors.mutedForeground, marginBottom: 4 }}>
                {formatAddress(ltv.collateral)}
              </div>
              <div style={{ display: 'flex', gap: '1rem', fontSize: 12 }}>
                <span>Borrow: {(Number(ltv.borrowLTV) / 1e4).toFixed(2)}%</span>
                <span>Liquidation: {(Number(ltv.liquidationLTV) / 1e4).toFixed(2)}%</span>
              </div>
            </div>
          ))}
        </Section>
      )}

      {/* Metadata */}
      {data?.products && data.products.length > 0 && (
        <Section title="Products">
          {data.products.map((p, idx) => (
            <div key={idx} style={{ padding: '0.5rem 0' }}>
              <div style={{ fontWeight: 500, color: colors.foreground }}>{p.name}</div>
              <div style={{ fontSize: 12, color: colors.mutedForeground }}>{p.description}</div>
            </div>
          ))}
        </Section>
      )}
    </div>
  )
}

// Detailed view for Earn vaults
function EarnVaultDetailView({ vaultKey }: { vaultKey: VaultKey }) {
  const vault = PRODUCT_VAULTS[vaultKey]

  const { data, isLoading, isError, error, source } = useEarnVaultInfo({
    vaultAddress: vault.address,
    options: { include: ['identity', 'financials', 'apy', 'config', 'strategies'] as const },
  })

  if (isLoading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: colors.mutedForeground }}>
        Loading vault data...
      </div>
    )
  }

  if (isError) {
    return (
      <div style={{ padding: '1rem', background: 'rgba(180, 70, 70, 0.15)', borderRadius: 8, color: colors.error }}>
        Error: {error?.message || 'Failed to load vault data'}
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 800 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ margin: 0, color: colors.foreground }}>{data?.vaultName || vault.name}</h2>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', alignItems: 'center' }}>
            <ProductBadge product={vault.product} />
            <span style={{ fontSize: 12, color: colors.mutedForeground, fontFamily: 'monospace' }}>
              {vault.address}
            </span>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: colors.primary, fontSize: 28, fontWeight: 700 }}>{formatAPYPercent(data?.apy7d)}</div>
          <div style={{ fontSize: 12, color: colors.mutedForeground }}>7-Day APY</div>
        </div>
      </div>

      {/* Source indicator */}
      <div
        style={{
          background: colors.muted,
          borderRadius: 8,
          padding: '0.75rem 1rem',
          marginBottom: '1.5rem',
          fontSize: 12,
          color: colors.mutedForeground,
        }}
      >
        Data source: {source.indexer ? 'Indexer' : source.vaultLens ? 'EarnVaultLens' : 'None'}
        {source.failedSources.length > 0 && <span style={{ color: colors.error }}> | Failed: {source.failedSources.join(', ')}</span>}
      </div>

      {/* Identity */}
      <Section title="Identity">
        <DataRow label="Vault Address" value={<code style={{ fontSize: 11 }}>{data?.vault}</code>} />
        <DataRow label="Vault Symbol" value={data?.vaultSymbol} />
        <DataRow label="Vault Decimals" value={data?.vaultDecimals} />
        <DataRow label="Asset Address" value={<code style={{ fontSize: 11 }}>{data?.asset}</code>} />
        <DataRow label="Asset Name" value={data?.assetName} />
        <DataRow label="Asset Symbol" value={data?.assetSymbol} />
        <DataRow label="Asset Decimals" value={data?.assetDecimals} />
      </Section>

      {/* APY */}
      <Section title="APY History">
        <DataRow label="Current APY" value={formatAPYPercent(data?.apyCurrent)} highlight />
        <DataRow label="7-Day APY" value={formatAPYPercent(data?.apy7d)} />
        <DataRow label="30-Day APY" value={formatAPYPercent(data?.apy30d)} />
        <DataRow label="90-Day APY" value={formatAPYPercent(data?.apy90d)} />
      </Section>

      {/* Financials */}
      <Section title="Financials">
        <DataRow label="Total Assets" value={formatBigInt(data?.totalAssets, data?.assetDecimals || 18)} />
        <DataRow label="Total Assets (USD)" value={formatUSD(data?.totalAssetsUSD)} highlight />
        <DataRow label="Available Assets" value={formatBigInt(data?.availableAssets, data?.assetDecimals || 18)} />
        <DataRow label="Available Assets (USD)" value={formatUSD(data?.availableAssetsUSD)} />
        <DataRow label="Total Shares" value={formatBigInt(data?.totalShares, data?.vaultDecimals || 18)} />
        <DataRow label="Lost Assets" value={formatBigInt(data?.lostAssets, data?.assetDecimals || 18)} />
      </Section>

      {/* Config */}
      <Section title="Configuration">
        <DataRow label="Performance Fee" value={data?.performanceFee ? `${(Number(data.performanceFee) / 1e16).toFixed(2)}%` : '-'} />
        <DataRow label="Fee Receiver" value={formatAddress(data?.feeReceiver)} />
        <DataRow label="Timelock" value={data?.timelock ? `${Number(data.timelock)}s` : '-'} />
        <DataRow label="Owner" value={formatAddress(data?.owner)} />
        <DataRow label="Curator" value={formatAddress(data?.curator)} />
        <DataRow label="Guardian" value={formatAddress(data?.guardian)} />
      </Section>

      {/* Strategies */}
      {data?.strategies && data.strategies.length > 0 && (
        <Section title={`Strategies (${data.strategies.length})`}>
          {data.strategies.map((strategy, idx) => (
            <div
              key={idx}
              style={{
                padding: '0.75rem 0',
                borderBottom: idx < data.strategies.length - 1 ? `1px solid ${colors.border}` : 'none',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <div>
                  <div style={{ fontWeight: 500, color: colors.foreground }}>
                    {strategy.strategyVaultName || `Strategy ${idx + 1}`}
                  </div>
                  <div style={{ fontSize: 11, color: colors.mutedForeground, fontFamily: 'monospace' }}>
                    {formatAddress(strategy.strategy)}
                  </div>
                </div>
                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: 4,
                    fontSize: 11,
                    fontWeight: 500,
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
                          ? colors.warning
                          : colors.error,
                  }}
                >
                  {strategy.status}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '1.5rem', fontSize: 12, color: colors.mutedForeground }}>
                <span>Allocated: {formatBigInt(strategy.allocatedAssets, data.assetDecimals || 18)}</span>
                {strategy.allocatedAssetsUSD !== null && (
                  <span>({formatUSD(strategy.allocatedAssetsUSD)})</span>
                )}
                <span>Cap: {formatBigInt(strategy.currentAllocationCap, data.assetDecimals || 18)}</span>
              </div>
            </div>
          ))}
        </Section>
      )}

      {/* Supply Queue */}
      {data?.supplyQueue && data.supplyQueue.length > 0 && (
        <Section title={`Supply Queue (${data.supplyQueue.length})`}>
          {data.supplyQueue.map((addr, idx) => (
            <div key={idx} style={{ padding: '0.25rem 0', fontSize: 12, fontFamily: 'monospace', color: colors.mutedForeground }}>
              {idx + 1}. {addr}
            </div>
          ))}
        </Section>
      )}
    </div>
  )
}

// Indexer status component
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
        color: colors.foreground,
      }}
    >
      <div
        style={{
          width: 10,
          height: 10,
          borderRadius: '50%',
          background: isError ? colors.error : isLoading ? colors.warning : colors.primary,
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

// Verification status component
function VerificationStatus() {
  const { data: verifiedVaults, isLoading: isVaultsLoading, isConfigured: isVaultsConfigured } = useVerifiedVaults()
  const { data: verifiedEarnVaults, isLoading: isEarnLoading, isConfigured: isEarnConfigured } = useVerifiedEarnVaults()

  return (
    <div
      style={{
        background: colors.panel,
        borderRadius: 8,
        padding: '0.75rem 1rem',
        marginBottom: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        fontSize: 13,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: isVaultsConfigured ? colors.primary : colors.warning,
          }}
        />
        <span style={{ color: colors.mutedForeground }}>
          GovernedPerspective:{' '}
          <span style={{ color: colors.foreground }}>
            {!isVaultsConfigured
              ? 'Not configured'
              : isVaultsLoading
                ? 'Loading...'
                : `${verifiedVaults?.length ?? 0} verified vaults`}
          </span>
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: isEarnConfigured ? colors.primary : colors.warning,
          }}
        />
        <span style={{ color: colors.mutedForeground }}>
          EulerEarnGovernedPerspective:{' '}
          <span style={{ color: colors.foreground }}>
            {!isEarnConfigured
              ? 'Not configured'
              : isEarnLoading
                ? 'Loading...'
                : `${verifiedEarnVaults?.length ?? 0} verified earn vaults`}
          </span>
        </span>
      </div>
    </div>
  )
}

// Collect all vault addresses by type
const REGULAR_VAULT_ADDRESSES = [
  PRODUCT_VAULTS['prime-whype'].address,
  PRODUCT_VAULTS['prime-khype'].address,
  PRODUCT_VAULTS['prime-usdt'].address,
  PRODUCT_VAULTS['yield-whype'].address,
  PRODUCT_VAULTS['yield-khype'].address,
  PRODUCT_VAULTS['yield-usdc'].address,
] as Address[]

const EARN_VAULT_ADDRESSES = [
  PRODUCT_VAULTS['earn-usdh'].address,
  PRODUCT_VAULTS['earn-usdc'].address,
] as Address[]

// Main dashboard with all products
function LiveDashboard() {
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(false)

  // Get verified vault sets
  const { verifiedSet: regularVerifiedSet, isPerspectiveConfigured: isRegularConfigured } = useVaults({
    vaults: REGULAR_VAULT_ADDRESSES,
    verified: showVerifiedOnly,
  })
  const { verifiedSet: earnVerifiedSet, isPerspectiveConfigured: isEarnConfigured } = useEarnVaults({
    vaults: EARN_VAULT_ADDRESSES,
    verified: showVerifiedOnly,
  })

  // Helper to check if a vault is verified
  const isVaultVerified = (address: Address, isEarn: boolean) => {
    const set = isEarn ? earnVerifiedSet : regularVerifiedSet
    return set.has(address.toLowerCase())
  }

  return (
    <div style={{ maxWidth: 1000 }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ margin: '0 0 0.5rem', fontSize: 24, color: colors.foreground }}>HypurrFi Vault Dashboard</h2>
        <p style={{ margin: 0, color: colors.mutedForeground, fontSize: 14 }}>
          Live data from Earn, Prime, and Yield products
        </p>
      </div>

      <IndexerStatus />
      <VerificationStatus />

      {/* Verified Filter Toggle */}
      <div
        style={{
          background: colors.panel,
          borderRadius: 8,
          padding: '0.75rem 1rem',
          marginBottom: '1.5rem',
          border: `1px solid ${colors.border}`,
        }}
      >
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={showVerifiedOnly}
            onChange={e => setShowVerifiedOnly(e.target.checked)}
            disabled={!isRegularConfigured && !isEarnConfigured}
            style={{ width: 16, height: 16, cursor: 'pointer' }}
          />
          <div>
            <span style={{ color: colors.foreground, fontWeight: 500 }}>Show Verified Only</span>
            <span style={{ color: colors.mutedForeground, fontSize: 12, marginLeft: '0.5rem' }}>
              Filter to vaults verified by perspective contracts
            </span>
          </div>
        </label>
      </div>

      {/* Earn Vaults */}
      <h3 style={{ color: colors.earnColor, margin: '2rem 0 1rem', fontSize: 16 }}>Earn Vaults</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
        <VaultOverviewCard vaultKey="earn-usdh" isVerified={isVaultVerified(PRODUCT_VAULTS['earn-usdh'].address, true)} />
        <VaultOverviewCard vaultKey="earn-usdc" isVerified={isVaultVerified(PRODUCT_VAULTS['earn-usdc'].address, true)} />
      </div>

      {/* Prime Vaults */}
      <h3 style={{ color: colors.primeColor, margin: '2rem 0 1rem', fontSize: 16 }}>Prime Vaults</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
        <VaultOverviewCard vaultKey="prime-whype" isVerified={isVaultVerified(PRODUCT_VAULTS['prime-whype'].address, false)} />
        <VaultOverviewCard vaultKey="prime-khype" isVerified={isVaultVerified(PRODUCT_VAULTS['prime-khype'].address, false)} />
        <VaultOverviewCard vaultKey="prime-usdt" isVerified={isVaultVerified(PRODUCT_VAULTS['prime-usdt'].address, false)} />
      </div>

      {/* Yield Vaults */}
      <h3 style={{ color: colors.yieldColor, margin: '2rem 0 1rem', fontSize: 16 }}>Yield Vaults</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
        <VaultOverviewCard vaultKey="yield-whype" isVerified={isVaultVerified(PRODUCT_VAULTS['yield-whype'].address, false)} />
        <VaultOverviewCard vaultKey="yield-khype" isVerified={isVaultVerified(PRODUCT_VAULTS['yield-khype'].address, false)} />
        <VaultOverviewCard vaultKey="yield-usdc" isVerified={isVaultVerified(PRODUCT_VAULTS['yield-usdc'].address, false)} />
      </div>

      <div style={{ marginTop: '2rem', fontSize: 12, color: colors.mutedForeground, textAlign: 'center' }}>
        Chain ID: 999 (HyperEVM)
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
Live dashboard demonstrating real vault data from HyperEVM across all HypurrFi products.

**Products:**
- **Earn** - Managed aggregator vaults with strategy allocations
- **Prime** - Cross-collateralized lending cluster for liquid assets
- **Yield** - Yield-bearing HYPE leverage strategies

The dashboard shows:
- Real-time APY data from the indexer
- TVL and financial metrics
- Automatic fallback to on-chain data when indexer unavailable
        `,
      },
    },
  },
}

export default meta

export const Dashboard: StoryObj = {
  name: 'Multi-Product Dashboard',
  render: () => <LiveDashboard />,
  parameters: {
    docs: {
      description: {
        story: 'Overview dashboard showing vaults from all three HypurrFi products: Earn, Prime, and Yield.',
      },
    },
  },
}

// Earn vault details
export const EarnUSDHDetail: StoryObj = {
  name: 'Earn: USDH Vault Detail',
  render: () => <EarnVaultDetailView vaultKey="earn-usdh" />,
  parameters: {
    docs: {
      description: {
        story: 'Detailed view of the USDH Earn vault showing all available data including strategies.',
      },
    },
  },
}

export const EarnUSDCDetail: StoryObj = {
  name: 'Earn: USDC Vault Detail',
  render: () => <EarnVaultDetailView vaultKey="earn-usdc" />,
  parameters: {
    docs: {
      description: {
        story: 'Detailed view of the USDC Earn vault.',
      },
    },
  },
}

// Prime vault details
export const PrimeWHYPEDetail: StoryObj = {
  name: 'Prime: WHYPE Vault Detail',
  render: () => <VaultDetailView vaultKey="prime-whype" />,
  parameters: {
    docs: {
      description: {
        story: 'Detailed view of the WHYPE Prime vault showing all available data.',
      },
    },
  },
}

export const PrimeKHYPEDetail: StoryObj = {
  name: 'Prime: kHYPE Vault Detail',
  render: () => <VaultDetailView vaultKey="prime-khype" />,
  parameters: {
    docs: {
      description: {
        story: 'Detailed view of the kHYPE Prime vault. Note the intrinsic APY from Kinetiq staking.',
      },
    },
  },
}

export const PrimeUSDTDetail: StoryObj = {
  name: 'Prime: USDT0 Vault Detail',
  render: () => <VaultDetailView vaultKey="prime-usdt" />,
  parameters: {
    docs: {
      description: {
        story: 'Detailed view of the USDT0 Prime vault.',
      },
    },
  },
}

// Yield vault details
export const YieldWHYPEDetail: StoryObj = {
  name: 'Yield: WHYPE Vault Detail',
  render: () => <VaultDetailView vaultKey="yield-whype" />,
  parameters: {
    docs: {
      description: {
        story: 'Detailed view of the WHYPE Yield vault.',
      },
    },
  },
}

export const YieldKHYPEDetail: StoryObj = {
  name: 'Yield: kHYPE Vault Detail',
  render: () => <VaultDetailView vaultKey="yield-khype" />,
  parameters: {
    docs: {
      description: {
        story: 'Detailed view of the kHYPE Yield vault. Shows intrinsic APY from staking.',
      },
    },
  },
}

export const YieldUSDCDetail: StoryObj = {
  name: 'Yield: USDC Vault Detail',
  render: () => <VaultDetailView vaultKey="yield-usdc" />,
  parameters: {
    docs: {
      description: {
        story: 'Detailed view of the USDC Yield vault.',
      },
    },
  },
}
