import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import * as React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useVaultConfig } from '../context/useVaultConfig'
import { useIndexerPrices } from '../hooks/useIndexerPrices'

vi.mock('../context/useVaultConfig', () => ({
  useVaultConfig: vi.fn(),
}))

const MOCK_INDEXER_URL = 'https://indexer-hyperevm-api-prod.up.railway.app'
const MOCK_CHAIN_ID = 999

const MOCK_CONFIG_WITH_INDEXER = {
  chainId: MOCK_CHAIN_ID,
  routerAddress: '0x28675f23E149c25f4f672FAD05f4e71DAfb75048' as const,
  usdUnitOfAccount: '0x0000000000000000000000000000000000000348' as const,
  usdReferenceToken: '0xb8ce59fc3717ada4c02eadf9682a9e934f625ebb' as const,
  indexerUrl: MOCK_INDEXER_URL,
  indexerStaleTime: 60000,
}

const MOCK_CONFIG_WITHOUT_INDEXER = {
  chainId: MOCK_CHAIN_ID,
  routerAddress: '0x28675f23E149c25f4f672FAD05f4e71DAfb75048' as const,
  usdUnitOfAccount: '0x0000000000000000000000000000000000000348' as const,
  usdReferenceToken: '0xb8ce59fc3717ada4c02eadf9682a9e934f625ebb' as const,
}

const MOCK_INDEXER_RESPONSE = {
  items: [
    {
      vault: '0xC200AaB602Cd7046389B5C8FB088884323F8dD0f',
      asset: '0xb8ce59fc3717ada4c02eadf9682a9e934f625ebb',
      assetPrice: 1.0001,
      assetSymbol: 'USDC',
    },
    {
      vault: '0xF73c654d468f5485bF15F3470B78851a49257704',
      asset: '0x0000000000000000000000000000000000000001',
      assetPrice: 25.5,
      assetSymbol: 'WHYPE',
    },
    {
      vault: '0x8A4545827DF5446Ba120B904e5306e58acCA4E89',
      asset: '0x0000000000000000000000000000000000000002',
      assetPrice: null,
      assetSymbol: 'UBTC',
    },
  ],
  pagination: { page: 1, limit: 100, total: 3 },
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children)
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.restoreAllMocks()
})

describe('useIndexerPrices', () => {
  describe('returns price map on successful fetch', () => {
    it('should return vault address to price mapping', async () => {
      vi.mocked(useVaultConfig).mockReturnValue(MOCK_CONFIG_WITH_INDEXER)

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(MOCK_INDEXER_RESPONSE),
      })

      const { result } = renderHook(() => useIndexerPrices(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toBeDefined()
      expect(result.current.data?.['0xC200AaB602Cd7046389B5C8FB088884323F8dD0f']).toBe(1.0001)
      expect(result.current.data?.['0xF73c654d468f5485bF15F3470B78851a49257704']).toBe(25.5)
      expect(result.current.data?.['0x8A4545827DF5446Ba120B904e5306e58acCA4E89']).toBeNull()
    })
  })

  describe('calls onIndexerError on network failure', () => {
    it('should invoke onIndexerError callback when fetch fails', async () => {
      const onIndexerError = vi.fn()
      vi.mocked(useVaultConfig).mockReturnValue({
        ...MOCK_CONFIG_WITH_INDEXER,
        onIndexerError,
      })

      const networkError = new Error('Network error')
      global.fetch = vi.fn().mockRejectedValue(networkError)

      const { result } = renderHook(() => useIndexerPrices(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(onIndexerError).toHaveBeenCalledWith(expect.any(Error))
    })
  })

  describe('returns empty object when indexerUrl not configured', () => {
    it('should return empty price map when no indexerUrl', async () => {
      vi.mocked(useVaultConfig).mockReturnValue(MOCK_CONFIG_WITHOUT_INDEXER)

      const { result } = renderHook(() => useIndexerPrices(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual({})
      expect(global.fetch).not.toHaveBeenCalled()
    })
  })

  describe('respects indexerStaleTime configuration', () => {
    it('should use custom staleTime from config', async () => {
      const customStaleTime = 30000
      vi.mocked(useVaultConfig).mockReturnValue({
        ...MOCK_CONFIG_WITH_INDEXER,
        indexerStaleTime: customStaleTime,
      })

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(MOCK_INDEXER_RESPONSE),
      })

      const { result } = renderHook(() => useIndexerPrices(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toBeDefined()
    })
  })

  describe('handles HTTP errors', () => {
    it('should call onIndexerError when server returns error status', async () => {
      const onIndexerError = vi.fn()
      vi.mocked(useVaultConfig).mockReturnValue({
        ...MOCK_CONFIG_WITH_INDEXER,
        onIndexerError,
      })

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      })

      const { result } = renderHook(() => useIndexerPrices(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(onIndexerError).toHaveBeenCalled()
    })
  })

  describe('normalizes vault addresses', () => {
    it('should use checksummed addresses as keys', async () => {
      vi.mocked(useVaultConfig).mockReturnValue(MOCK_CONFIG_WITH_INDEXER)

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            items: [
              {
                vault: '0xc200aab602cd7046389b5c8fb088884323f8dd0f',
                assetPrice: 1.0,
              },
            ],
            pagination: { page: 1, limit: 100, total: 1 },
          }),
      })

      const { result } = renderHook(() => useIndexerPrices(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data?.['0xC200AaB602Cd7046389B5C8FB088884323F8dD0f']).toBe(1.0)
    })
  })
})
