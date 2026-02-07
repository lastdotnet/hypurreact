import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Address } from 'viem'
import { useVaultConfig } from '../context/useVaultConfig'
import { useIndexerVaultData } from '../hooks/useIndexerVaultData'
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
const MOCK_VAULT_ADDRESS = '0xF73c654d468f5485bF15F3470B78851a49257704' as Address

const MOCK_CONFIG = {
  chainId: 999,
  usdUnitOfAccount: '0x0000000000000000000000000000000000000348' as Address,
  usdReferenceToken: '0xb8ce59fc3717ada4c02eadf9682a9e934f625ebb' as Address,
  indexerUrl: 'https://indexer-test.example.com',
  indexerStaleTime: 60000,
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

function createMockIndexerResponse(vaultOverrides: Record<string, unknown> = {}) {
  return {
    items: [
      {
        vault: MOCK_VAULT_ADDRESS,
        vaultName: 'EVK Vault eWHYPE-2',
        vaultSymbol: 'eWHYPE-2',
        vaultDecimals: 18,
        asset: '0x1234567890123456789012345678901234567890',
        assetSymbol: 'WHYPE',
        assetDecimals: 18,
        assetPrice: 10.5,
        assetPriceTimestamp: new Date().toISOString(),
        totalAssets: '1000000000000000000',
        baseApy: 0.01,
        intrinsicApy: null,
        rewardApy: null,
        totalApy: 0.01,
        ...vaultOverrides,
      },
    ],
    pagination: { page: 1, limit: 100, total: 1 },
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(useVaultConfig).mockReturnValue(MOCK_CONFIG)
})

describe('useIndexerVaultData', () => {
  describe('fetches data successfully', () => {
    it('should fetch and transform vault data from indexer', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => createMockIndexerResponse(),
      })

      const { result } = renderHook(
        () =>
          useIndexerVaultData({
            vaultAddress: MOCK_VAULT_ADDRESS,
          }),
        { wrapper: createWrapper() },
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.data).toBeDefined()
      expect(result.current.data?.vaultName).toBe('EVK Vault eWHYPE-2')
      expect(result.current.isError).toBe(false)
    })
  })

  // REGRESSION TESTS for bug fixes
  describe('regression tests', () => {
    it('should use totalApy for supplyAPY, not baseApy (bug fix for kHYPE yield)', async () => {
      // Bug: kHYPE vault was showing 0% APY because code used baseApy
      // Fix: Use totalApy which includes intrinsicApy (staking yield)
      const mockResponse = createMockIndexerResponse({
        baseApy: 0, // kHYPE has 0 base APY
        intrinsicApy: {
          apy: 2.16, // Staking yield from Kinetiq
          timestamp: new Date().toISOString(),
          provider: 'KINETIQ',
        },
        totalApy: 2.16, // totalApy = baseApy + intrinsicApy
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const { result } = renderHook(
        () =>
          useIndexerVaultData({
            vaultAddress: MOCK_VAULT_ADDRESS,
          }),
        { wrapper: createWrapper() },
      )

      await waitFor(() => {
        expect(result.current.data).toBeDefined()
      })

      // supplyAPY should be 2.16 (totalApy), NOT 0 (baseApy)
      expect(result.current.data?.supplyAPY).toBe(2.16)
      // baseAPY should still be the raw base value
      expect(result.current.data?.baseAPY).toBe(0)
    })

    it('should include intrinsic yield in supplyAPY for staked assets', async () => {
      // wstHYPE, kHYPE, beHYPE etc. have intrinsic yield from staking
      const mockResponse = createMockIndexerResponse({
        baseApy: 0.015, // Small lending yield
        intrinsicApy: {
          apy: 2.18, // Staking yield
          timestamp: new Date().toISOString(),
          provider: 'VALANTIS',
        },
        totalApy: 2.195, // Combined yield
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const { result } = renderHook(
        () =>
          useIndexerVaultData({
            vaultAddress: MOCK_VAULT_ADDRESS,
          }),
        { wrapper: createWrapper() },
      )

      await waitFor(() => {
        expect(result.current.data).toBeDefined()
      })

      // supplyAPY should be the total (2.195), including intrinsic yield
      expect(result.current.data?.supplyAPY).toBe(2.195)
    })

    it('should fall back to baseApy when totalApy is null', async () => {
      const mockResponse = createMockIndexerResponse({
        baseApy: 5.5,
        totalApy: null,
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const { result } = renderHook(
        () =>
          useIndexerVaultData({
            vaultAddress: MOCK_VAULT_ADDRESS,
          }),
        { wrapper: createWrapper() },
      )

      await waitFor(() => {
        expect(result.current.data).toBeDefined()
      })

      // Should fall back to baseApy when totalApy is null
      expect(result.current.data?.supplyAPY).toBe(5.5)
    })

    it('should extract intrinsicAPY from nested object structure', async () => {
      // Indexer returns intrinsicApy as { apy: number, provider: string, ... }
      const mockResponse = createMockIndexerResponse({
        baseApy: 0.01,
        intrinsicApy: {
          apy: 2.16,
          timestamp: new Date().toISOString(),
          provider: 'KINETIQ',
          source: 'https://api.example.com',
          description: 'kHYPE staking yield',
        },
        totalApy: 2.17,
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const { result } = renderHook(
        () =>
          useIndexerVaultData({
            vaultAddress: MOCK_VAULT_ADDRESS,
          }),
        { wrapper: createWrapper() },
      )

      await waitFor(() => {
        expect(result.current.data).toBeDefined()
      })

      // intrinsicAPY should be extracted from the nested object
      expect(result.current.data?.intrinsicAPY).toBe(2.16)
      expect(result.current.data?.baseAPY).toBe(0.01)
      expect(result.current.data?.supplyAPY).toBe(2.17) // totalApy
    })

    it('should return null for intrinsicAPY when not present', async () => {
      const mockResponse = createMockIndexerResponse({
        baseApy: 5.5,
        intrinsicApy: null,
        totalApy: 5.5,
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const { result } = renderHook(
        () =>
          useIndexerVaultData({
            vaultAddress: MOCK_VAULT_ADDRESS,
          }),
        { wrapper: createWrapper() },
      )

      await waitFor(() => {
        expect(result.current.data).toBeDefined()
      })

      expect(result.current.data?.intrinsicAPY).toBeNull()
    })
  })
})
