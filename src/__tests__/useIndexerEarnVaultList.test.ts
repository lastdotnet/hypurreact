import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Address } from 'viem'
import { useVaultConfig } from '../context/useVaultConfig'
import { useIndexerEarnVaultList } from '../hooks/useIndexerEarnVaultList'
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
const MOCK_CONFIG = {
  chainId: 999,
  usdUnitOfAccount: '0x0000000000000000000000000000000000000348' as Address,
  usdReferenceToken: '0xb8ce59fc3717ada4c02eadf9682a9e934f625ebb' as Address,
  indexerUrl: 'https://indexer-test.example.com',
  indexerStaleTime: 60000,
}

const MOCK_EARN_VAULTS = [
  '0xF38eA9DE758a8F6be08B6E65bc0Ff2f3e3aB741b',
  '0xe8b10461ea0b04FF30F4cBfc3E93957Cac00DEd4',
  '0x6dd448d5cb73DC96788d5BE605DD3C5c83864a36',
  '0xF868A2B30854FE13e26F7AB7a92609cCb6b9c0e1',
] as Address[]

const MOCK_INDEXER_RESPONSE = {
  items: MOCK_EARN_VAULTS.map(vault => ({ vault })),
  pagination: {
    skip: 0,
    take: 100,
    total: 4,
  },
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

describe('useIndexerEarnVaultList', () => {
  describe('fetches data successfully', () => {
    it('should fetch and return earn vault addresses from indexer', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => MOCK_INDEXER_RESPONSE,
      })

      const { result } = renderHook(() => useIndexerEarnVaultList(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.vaults).toBeDefined()
      expect(result.current.vaults).toHaveLength(4)
      expect(result.current.isError).toBe(false)
    })

    it('should call correct API endpoint', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => MOCK_INDEXER_RESPONSE,
      })

      renderHook(() => useIndexerEarnVaultList(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled()
      })

      const fetchCall = mockFetch.mock.calls[0]
      expect(fetchCall[0]).toContain('/v1/earn/vaults')
      expect(fetchCall[0]).toContain('chainId=999')
    })

    it('should normalize addresses using getAddress', async () => {
      // Response with lowercase addresses
      const responseWithLowercase = {
        items: [
          { vault: '0xf38ea9de758a8f6be08b6e65bc0ff2f3e3ab741b' },
          { vault: '0xe8b10461ea0b04ff30f4cbfc3e93957cac00ded4' },
        ],
        pagination: { skip: 0, take: 100, total: 2 },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => responseWithLowercase,
      })

      const { result } = renderHook(() => useIndexerEarnVaultList(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.vaults).toHaveLength(2)
      })

      // Addresses should be checksummed
      expect(result.current.vaults?.[0]).toBe('0xF38eA9DE758a8F6be08B6E65bc0Ff2f3e3aB741b')
      expect(result.current.vaults?.[1]).toBe('0xe8b10461ea0b04FF30F4cBfc3E93957Cac00DEd4')
    })
  })

  describe('handles errors', () => {
    it('should handle API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      })

      const { result } = renderHook(() => useIndexerEarnVaultList(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.vaults).toBeUndefined()
      expect(result.current.error).toBeDefined()
    })

    it('should reject entire response when any item has invalid address (Zod validation)', async () => {
      const responseWithInvalid = {
        items: [
          { vault: '0xF38eA9DE758a8F6be08B6E65bc0Ff2f3e3aB741b' },
          { vault: 'invalid-address' }, // Invalid - causes entire response rejection
          { vault: '0xe8b10461ea0b04FF30F4cBfc3E93957Cac00DEd4' },
        ],
        pagination: { skip: 0, take: 100, total: 3 },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => responseWithInvalid,
      })

      const { result } = renderHook(() => useIndexerEarnVaultList(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Zod validation rejects entire response if any item fails validation
      // This is stricter but safer than silently skipping bad data
      expect(result.current.vaults).toHaveLength(0)
      expect(result.current.isError).toBe(false) // Returns empty array, not error
    })
  })

  describe('handles missing indexer URL', () => {
    it('should not fetch when indexerUrl is not configured', async () => {
      vi.mocked(useVaultConfig).mockReturnValue({
        ...MOCK_CONFIG,
        indexerUrl: undefined,
      })

      const { result } = renderHook(() => useIndexerEarnVaultList(), {
        wrapper: createWrapper(),
      })

      await new Promise(resolve => setTimeout(resolve, 100))

      expect(mockFetch).not.toHaveBeenCalled()
      expect(result.current.vaults).toBeUndefined()
      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('handles empty response', () => {
    it('should return empty array when no vaults exist', async () => {
      const emptyResponse = {
        items: [],
        pagination: { skip: 0, take: 100, total: 0 },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => emptyResponse,
      })

      const { result } = renderHook(() => useIndexerEarnVaultList(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.vaults).toEqual([])
      expect(result.current.isError).toBe(false)
    })
  })
})
