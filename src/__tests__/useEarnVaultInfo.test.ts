import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Address } from 'viem'
import { useVaultConfig } from '../context/useVaultConfig'
import { useEarnVaultInfo } from '../hooks/useEarnVaultInfo'
import { useIndexerEarnVaultData } from '../hooks/useIndexerEarnVaultData'
import { useEarnVaultLensData } from '../hooks/useEarnVaultLensData'

// Mock dependencies
vi.mock('wagmi', () => ({
  useReadContract: vi.fn(),
}))

vi.mock('../context/useVaultConfig', () => ({
  useVaultConfig: vi.fn(),
}))

vi.mock('../hooks/useIndexerEarnVaultData', () => ({
  useIndexerEarnVaultData: vi.fn(),
}))

vi.mock('../hooks/useEarnVaultLensData', () => ({
  useEarnVaultLensData: vi.fn(),
}))

// Test data
const MOCK_VAULT_ADDRESS = '0xF38eA9DE758a8F6be08B6E65bc0Ff2f3e3aB741b' as Address
const MOCK_ASSET_ADDRESS = '0x1234567890123456789012345678901234567890' as Address

const MOCK_CONFIG = {
  chainId: 999,
  usdUnitOfAccount: '0x0000000000000000000000000000000000000348' as Address,
  usdReferenceToken: '0xb8ce59fc3717ada4c02eadf9682a9e934f625ebb' as Address,
  indexerUrl: 'https://indexer-test.example.com',
}

const MOCK_INDEXER_DATA = {
  vault: MOCK_VAULT_ADDRESS,
  vaultName: 'Test Earn Vault',
  vaultSymbol: 'eTestVault',
  vaultDecimals: 18,
  asset: MOCK_ASSET_ADDRESS,
  assetName: 'Test Asset',
  assetSymbol: 'TEST',
  assetDecimals: 18,
  totalShares: 1000000000000000000n,
  totalAssets: 1000000000000000000n,
  totalAssetsUSD: 1000,
  availableAssets: 500000000000000000n,
  availableAssetsUSD: 500,
  lostAssets: 0n,
  apy7d: 0.05,
  apy30d: 0.048,
  apy90d: 0.052,
  apyCurrent: 0.051,
  performanceFee: 1000000000000000000n,
  feeReceiver: '0x0000000000000000000000000000000000000001' as Address,
  timelock: 86400n,
  owner: '0x0000000000000000000000000000000000000002' as Address,
  creator: '0x0000000000000000000000000000000000000003' as Address,
  curator: '0x0000000000000000000000000000000000000004' as Address,
  guardian: '0x0000000000000000000000000000000000000005' as Address,
  evc: '0x0000000000000000000000000000000000000006' as Address,
  permit2: '0x0000000000000000000000000000000000000007' as Address,
  supplyQueue: [],
  strategies: [],
}

const MOCK_VAULTLENS_DATA = {
  ...MOCK_INDEXER_DATA,
  totalAssetsUSD: null, // VaultLens doesn't have USD values
  availableAssetsUSD: null,
  apy7d: null, // VaultLens doesn't have APY
  apy30d: null,
  apy90d: null,
  apyCurrent: null,
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(useVaultConfig).mockReturnValue(MOCK_CONFIG)
})

describe('useEarnVaultInfo', () => {
  describe('returns indexer data when available', () => {
    it('should return indexer data with correct source', () => {
      vi.mocked(useIndexerEarnVaultData).mockReturnValue({
        data: MOCK_INDEXER_DATA,
        isLoading: false,
        isError: false,
        error: null,
      })

      vi.mocked(useEarnVaultLensData).mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: false,
        error: null,
      })

      const { result } = renderHook(() =>
        useEarnVaultInfo({
          vaultAddress: MOCK_VAULT_ADDRESS,
          options: { include: ['identity', 'financials', 'apy'] },
        }),
      )

      expect(result.current.data).toBeDefined()
      expect(result.current.data?.vaultName).toBe('Test Earn Vault')
      expect(result.current.data?.apy7d).toBe(0.05)
      expect(result.current.source.indexer).toBe(true)
      expect(result.current.source.vaultLens).toBe(false)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.isError).toBe(false)
    })
  })

  describe('falls back to VaultLens when indexer fails', () => {
    it('should use VaultLens data on indexer error', () => {
      vi.mocked(useIndexerEarnVaultData).mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        error: new Error('Indexer failed'),
      })

      vi.mocked(useEarnVaultLensData).mockReturnValue({
        data: MOCK_VAULTLENS_DATA,
        isLoading: false,
        isError: false,
        error: null,
      })

      const { result } = renderHook(() =>
        useEarnVaultInfo({
          vaultAddress: MOCK_VAULT_ADDRESS,
          options: { include: ['identity', 'financials'] },
        }),
      )

      expect(result.current.data).toBeDefined()
      expect(result.current.data?.vaultName).toBe('Test Earn Vault')
      expect(result.current.source.indexer).toBe(false)
      expect(result.current.source.vaultLens).toBe(true)
      expect(result.current.source.failedSources).toContain('indexer')
    })
  })

  describe('handles forceOnchain option', () => {
    it('should only fetch from VaultLens when forceOnchain is true', () => {
      vi.mocked(useIndexerEarnVaultData).mockReturnValue({
        data: MOCK_INDEXER_DATA,
        isLoading: false,
        isError: false,
        error: null,
      })

      vi.mocked(useEarnVaultLensData).mockReturnValue({
        data: MOCK_VAULTLENS_DATA,
        isLoading: false,
        isError: false,
        error: null,
      })

      renderHook(() =>
        useEarnVaultInfo({
          vaultAddress: MOCK_VAULT_ADDRESS,
          options: { include: ['identity'], forceOnchain: true },
        }),
      )

      // When forceOnchain is true, indexer is disabled
      const indexerCall = vi.mocked(useIndexerEarnVaultData).mock.calls[0]
      expect(indexerCall?.[0]?.enabled).toBe(false)

      // VaultLens should be enabled
      const vaultLensCall = vi.mocked(useEarnVaultLensData).mock.calls[0]
      expect(vaultLensCall?.[0]?.enabled).toBe(true)
    })
  })

  describe('handles loading states', () => {
    it('should indicate loading when indexer is loading', () => {
      vi.mocked(useIndexerEarnVaultData).mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        error: null,
      })

      vi.mocked(useEarnVaultLensData).mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: false,
        error: null,
      })

      const { result } = renderHook(() =>
        useEarnVaultInfo({
          vaultAddress: MOCK_VAULT_ADDRESS,
          options: { include: ['identity'] },
        }),
      )

      expect(result.current.isLoading).toBe(true)
    })
  })

  describe('includes correct fields for each category', () => {
    it('should include identity fields when identity category is requested', () => {
      vi.mocked(useIndexerEarnVaultData).mockReturnValue({
        data: MOCK_INDEXER_DATA,
        isLoading: false,
        isError: false,
        error: null,
      })

      vi.mocked(useEarnVaultLensData).mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: false,
        error: null,
      })

      const { result } = renderHook(() =>
        useEarnVaultInfo({
          vaultAddress: MOCK_VAULT_ADDRESS,
          options: { include: ['identity'] as const },
        }),
      )

      expect(result.current.data?.vault).toBeDefined()
      expect(result.current.data?.vaultName).toBeDefined()
      expect(result.current.data?.vaultSymbol).toBeDefined()
      expect(result.current.data?.asset).toBeDefined()
    })

    it('should include APY fields when apy category is requested', () => {
      vi.mocked(useIndexerEarnVaultData).mockReturnValue({
        data: MOCK_INDEXER_DATA,
        isLoading: false,
        isError: false,
        error: null,
      })

      vi.mocked(useEarnVaultLensData).mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: false,
        error: null,
      })

      const { result } = renderHook(() =>
        useEarnVaultInfo({
          vaultAddress: MOCK_VAULT_ADDRESS,
          options: { include: ['apy'] as const },
        }),
      )

      expect(result.current.data?.apy7d).toBe(0.05)
      expect(result.current.data?.apy30d).toBe(0.048)
      expect(result.current.data?.apy90d).toBe(0.052)
      expect(result.current.data?.apyCurrent).toBe(0.051)
    })

    it('should include strategies fields when strategies category is requested', () => {
      vi.mocked(useIndexerEarnVaultData).mockReturnValue({
        data: MOCK_INDEXER_DATA,
        isLoading: false,
        isError: false,
        error: null,
      })

      vi.mocked(useEarnVaultLensData).mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: false,
        error: null,
      })

      const { result } = renderHook(() =>
        useEarnVaultInfo({
          vaultAddress: MOCK_VAULT_ADDRESS,
          options: { include: ['strategies'] as const },
        }),
      )

      expect(result.current.data?.supplyQueue).toBeDefined()
      expect(result.current.data?.strategies).toBeDefined()
    })
  })

  describe('respects enabled flag', () => {
    it('should not fetch when enabled is false', () => {
      vi.mocked(useIndexerEarnVaultData).mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: false,
        error: null,
      })

      vi.mocked(useEarnVaultLensData).mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: false,
        error: null,
      })

      renderHook(() =>
        useEarnVaultInfo({
          vaultAddress: MOCK_VAULT_ADDRESS,
          options: { include: ['identity'] },
          enabled: false,
        }),
      )

      const indexerCall = vi.mocked(useIndexerEarnVaultData).mock.calls[0]
      expect(indexerCall?.[0]?.enabled).toBe(false)
    })
  })

  // REGRESSION TESTS for bug fixes
  describe('regression tests', () => {
    it('should use indexer as source when indexer data is available (not show as failed)', () => {
      vi.mocked(useIndexerEarnVaultData).mockReturnValue({
        data: MOCK_INDEXER_DATA,
        isLoading: false,
        isError: false,
        error: null,
      })

      vi.mocked(useEarnVaultLensData).mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: false,
        error: null,
      })

      const { result } = renderHook(() =>
        useEarnVaultInfo({
          vaultAddress: MOCK_VAULT_ADDRESS,
          options: { include: ['identity', 'apy'] },
        }),
      )

      // Indexer should be marked as the source, not failed
      expect(result.current.source.indexer).toBe(true)
      expect(result.current.source.failedSources).not.toContain('indexer')
      expect(result.current.isError).toBe(false)
    })

    it('should pass APY values from indexer unchanged (values are already percentages)', () => {
      // Bug fix: APY from indexer is already a percentage (5.25 = 5.25%)
      // Should NOT be multiplied by 100
      const indexerDataWithAPY = {
        ...MOCK_INDEXER_DATA,
        apy7d: 5.25, // 5.25%
        apy30d: 4.8, // 4.8%
        apy90d: 6.1, // 6.1%
        apyCurrent: 5.5, // 5.5%
      }

      vi.mocked(useIndexerEarnVaultData).mockReturnValue({
        data: indexerDataWithAPY,
        isLoading: false,
        isError: false,
        error: null,
      })

      vi.mocked(useEarnVaultLensData).mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: false,
        error: null,
      })

      const { result } = renderHook(() =>
        useEarnVaultInfo({
          vaultAddress: MOCK_VAULT_ADDRESS,
          options: { include: ['apy'] },
        }),
      )

      // APY should be passed through unchanged
      expect(result.current.data?.apy7d).toBe(5.25)
      expect(result.current.data?.apy30d).toBe(4.8)
      expect(result.current.data?.apy90d).toBe(6.1)
      expect(result.current.data?.apyCurrent).toBe(5.5)
    })

    it('should properly track source when using earn vault data', () => {
      vi.mocked(useIndexerEarnVaultData).mockReturnValue({
        data: MOCK_INDEXER_DATA,
        isLoading: false,
        isError: false,
        error: null,
      })

      vi.mocked(useEarnVaultLensData).mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: false,
        error: null,
      })

      const { result } = renderHook(() =>
        useEarnVaultInfo({
          vaultAddress: MOCK_VAULT_ADDRESS,
          options: { include: ['identity', 'financials', 'apy'] },
        }),
      )

      // Source should indicate indexer was used
      expect(result.current.source.indexer).toBe(true)
      expect(result.current.source.vaultLens).toBe(false)
      // Data should be present
      expect(result.current.data?.vaultName).toBe('Test Earn Vault')
    })
  })
})
