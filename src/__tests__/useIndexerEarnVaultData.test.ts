import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Address } from 'viem'
import { useVaultConfig } from '../context/useVaultConfig'
import { useIndexerEarnVaultData } from '../hooks/useIndexerEarnVaultData'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import * as React from 'react'

// Mock dependencies
vi.mock('../context/useVaultConfig', () => ({
  useVaultConfig: vi.fn(),
}))

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

// Test data
const MOCK_VAULT_ADDRESS = '0xF38eA9DE758a8F6be08B6E65bc0Ff2f3e3aB741b' as Address

const MOCK_CONFIG = {
  chainId: 999,
  usdUnitOfAccount: '0x0000000000000000000000000000000000000348' as Address,
  usdReferenceToken: '0xb8ce59fc3717ada4c02eadf9682a9e934f625ebb' as Address,
  indexerUrl: 'https://indexer-test.example.com',
  indexerStaleTime: 60000,
}

const MOCK_INDEXER_RESPONSE = {
  vault: {
    vault: MOCK_VAULT_ADDRESS,
    vaultName: 'Test Earn Vault',
    vaultSymbol: 'eTestVault',
    vaultDecimals: 18,
    asset: '0x1234567890123456789012345678901234567890',
    assetName: 'Test Asset',
    assetSymbol: 'TEST',
    assetDecimals: 18,
    totalShares: '1000000000000000000',
    totalAssets: '1000000000000000000',
    totalAssetsUSD: 1000,
    availableAssets: '500000000000000000',
    availableAssetsUSD: 500,
    lostAssets: '0',
    performanceFee: '100000000000000000',
    feeReceiver: '0x0000000000000000000000000000000000000001',
    timelock: '86400',
    owner: '0x0000000000000000000000000000000000000002',
    creator: '0x0000000000000000000000000000000000000003',
    curator: '0x0000000000000000000000000000000000000004',
    guardian: '0x0000000000000000000000000000000000000005',
    evc: '0x0000000000000000000000000000000000000006',
    permit2: '0x0000000000000000000000000000000000000007',
    supplyQueue: [],
    strategies: [],
    apy7d: 0.05,
    apy30d: 0.048,
    apy90d: 0.052,
    apyCurrent: 0.051,
    timestamp: new Date().toISOString(),
  },
  strategies: [],
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children)
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(useVaultConfig).mockReturnValue(MOCK_CONFIG)
})

describe('useIndexerEarnVaultData', () => {
  describe('fetches data successfully', () => {
    it('should fetch and transform earn vault data from indexer', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => MOCK_INDEXER_RESPONSE,
      })

      const { result } = renderHook(
        () =>
          useIndexerEarnVaultData({
            vaultAddress: MOCK_VAULT_ADDRESS,
          }),
        { wrapper: createWrapper() },
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.data).toBeDefined()
      expect(result.current.data?.vaultName).toBe('Test Earn Vault')
      expect(result.current.data?.apy7d).toBe(0.05)
      expect(result.current.data?.totalAssets).toBe(1000000000000000000n)
      expect(result.current.isError).toBe(false)
    })

    it('should call correct API endpoint', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => MOCK_INDEXER_RESPONSE,
      })

      renderHook(
        () =>
          useIndexerEarnVaultData({
            vaultAddress: MOCK_VAULT_ADDRESS,
          }),
        { wrapper: createWrapper() },
      )

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled()
      })

      const fetchCall = mockFetch.mock.calls[0]
      expect(fetchCall[0]).toContain('/v1/earn/vault')
      // REGRESSION: Must use vaultAddress parameter, not vault (bug fix)
      expect(fetchCall[0]).toContain(`vaultAddress=${MOCK_VAULT_ADDRESS}`)
      expect(fetchCall[0]).not.toContain('vault=0x') // Ensure old param name isn't used
      expect(fetchCall[0]).toContain('chainId=999')
    })
  })

  describe('handles errors', () => {
    it('should handle API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      })

      const { result } = renderHook(
        () =>
          useIndexerEarnVaultData({
            vaultAddress: MOCK_VAULT_ADDRESS,
          }),
        { wrapper: createWrapper() },
      )

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.data).toBeUndefined()
      expect(result.current.error).toBeDefined()
    })

    it('should return null for 404 responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      })

      const { result } = renderHook(
        () =>
          useIndexerEarnVaultData({
            vaultAddress: MOCK_VAULT_ADDRESS,
          }),
        { wrapper: createWrapper() },
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // 404 is not an error, just returns null
      expect(result.current.data).toBeUndefined()
    })
  })

  describe('respects enabled flag', () => {
    it('should not fetch when enabled is false', async () => {
      const { result } = renderHook(
        () =>
          useIndexerEarnVaultData({
            vaultAddress: MOCK_VAULT_ADDRESS,
            enabled: false,
          }),
        { wrapper: createWrapper() },
      )

      // Wait a tick to ensure no fetch is made
      await new Promise(resolve => setTimeout(resolve, 100))

      expect(mockFetch).not.toHaveBeenCalled()
      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('handles missing indexer URL', () => {
    it('should not fetch when indexerUrl is not configured', async () => {
      vi.mocked(useVaultConfig).mockReturnValue({
        ...MOCK_CONFIG,
        indexerUrl: undefined,
      })

      const { result } = renderHook(
        () =>
          useIndexerEarnVaultData({
            vaultAddress: MOCK_VAULT_ADDRESS,
          }),
        { wrapper: createWrapper() },
      )

      await new Promise(resolve => setTimeout(resolve, 100))

      expect(mockFetch).not.toHaveBeenCalled()
      expect(result.current.data).toBeUndefined()
    })
  })

  describe('transforms strategy data correctly', () => {
    it('should transform strategy status from removableAt', async () => {
      const pastTimestamp = Math.floor(Date.now() / 1000) - 86400 // 1 day ago
      const futureTimestamp = Math.floor(Date.now() / 1000) + 86400 // 1 day from now

      const responseWithStrategies = {
        ...MOCK_INDEXER_RESPONSE,
        vault: {
          ...MOCK_INDEXER_RESPONSE.vault,
          strategies: [
            {
              strategy: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
              strategyVaultName: 'Active Strategy',
              removableAt: '0',
            },
            {
              strategy: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
              strategyVaultName: 'Pending Removal Strategy',
              removableAt: String(futureTimestamp),
            },
            {
              strategy: '0xcccccccccccccccccccccccccccccccccccccccc',
              strategyVaultName: 'Removed Strategy',
              removableAt: String(pastTimestamp),
            },
          ],
        },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => responseWithStrategies,
      })

      const { result } = renderHook(
        () =>
          useIndexerEarnVaultData({
            vaultAddress: MOCK_VAULT_ADDRESS,
          }),
        { wrapper: createWrapper() },
      )

      await waitFor(() => {
        expect(result.current.data?.strategies).toHaveLength(3)
      })

      expect(result.current.data?.strategies?.[0]?.status).toBe('active')
      expect(result.current.data?.strategies?.[1]?.status).toBe('pending_removal')
      expect(result.current.data?.strategies?.[2]?.status).toBe('removed')
    })
  })

  // REGRESSION TESTS for bug fixes
  describe('regression tests', () => {
    it('should use vaultAddress query parameter not vault (bug fix)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => MOCK_INDEXER_RESPONSE,
      })

      renderHook(
        () =>
          useIndexerEarnVaultData({
            vaultAddress: MOCK_VAULT_ADDRESS,
          }),
        { wrapper: createWrapper() },
      )

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled()
      })

      const url = mockFetch.mock.calls[0][0] as string
      // The API expects vaultAddress=, not vault=
      expect(url).toMatch(/vaultAddress=0x[a-fA-F0-9]{40}/)
      expect(url).not.toMatch(/[?&]vault=0x/)
    })

    it('should pass APY values through unchanged from indexer (not multiplied)', async () => {
      // The indexer returns APY as percentages (e.g., 5.25 means 5.25%)
      // NOT as decimals (e.g., 0.0525)
      const responseWithAPY = {
        vault: {
          ...MOCK_INDEXER_RESPONSE.vault,
          apy7d: 5.25, // 5.25%
          apy30d: 4.8, // 4.8%
          apy90d: 6.1, // 6.1%
          apyCurrent: 5.5, // 5.5%
        },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => responseWithAPY,
      })

      const { result } = renderHook(
        () =>
          useIndexerEarnVaultData({
            vaultAddress: MOCK_VAULT_ADDRESS,
          }),
        { wrapper: createWrapper() },
      )

      await waitFor(() => {
        expect(result.current.data).toBeDefined()
      })

      // APY values should be passed through unchanged
      // They are already percentages from the indexer
      expect(result.current.data?.apy7d).toBe(5.25)
      expect(result.current.data?.apy30d).toBe(4.8)
      expect(result.current.data?.apy90d).toBe(6.1)
      expect(result.current.data?.apyCurrent).toBe(5.5)
    })
  })
})
