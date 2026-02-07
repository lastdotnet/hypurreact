/**
 * Integration tests using MSW to mock API responses.
 *
 * These tests verify the full data flow from hook → fetch → transform
 * without mocking internal dependencies, catching issues like:
 * - API contract changes
 * - Zod validation failures
 * - Data transformation bugs
 */
import { renderHook, waitFor } from '@testing-library/react'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import type { Address } from 'viem'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import * as React from 'react'

import { server } from './msw/server'
import {
  MOCK_CHAIN_ID,
  MOCK_VAULT_ADDRESS,
  MOCK_EARN_VAULT_ADDRESS,
  requestTracker,
  errorHandlers,
} from './msw/handlers'

// Mock the context hook to provide config
vi.mock('../context/useVaultConfig', () => ({
  useVaultConfig: () => ({
    chainId: MOCK_CHAIN_ID,
    usdUnitOfAccount: '0x0000000000000000000000000000000000000348' as Address,
    usdReferenceToken: '0xb8ce59fc3717ada4c02eadf9682a9e934f625ebb' as Address,
    indexerUrl: 'https://indexer-test.example.com',
    indexerStaleTime: 60000,
    retry: { count: 0 }, // Disable retries in tests for immediate error feedback
  }),
}))

// Import hooks after mocking context
import { useIndexerData } from '../hooks/useIndexerData'
import { useIndexerVaultData } from '../hooks/useIndexerVaultData'
import { useIndexerEarnVaultList } from '../hooks/useIndexerEarnVaultList'
import { useIndexerEarnVaultData } from '../hooks/useIndexerEarnVaultData'

// Start MSW server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => {
  server.resetHandlers()
  requestTracker.reset()
})
afterAll(() => server.close())

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  })
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children)
  }
}

describe('Integration Tests with MSW', () => {
  describe('useIndexerData (shared vault list hook)', () => {
    it('should fetch and validate vault list data', async () => {
      const { result } = renderHook(() => useIndexerData(), { wrapper: createWrapper() })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.data).toBeDefined()
      const data = result.current.data!
      expect(data.items).toHaveLength(1)
      expect(data.items[0]!.vault).toBe(MOCK_VAULT_ADDRESS)
      expect(data.items[0]!.assetPrice).toBe(100.5)
      expect(requestTracker.vaultListCalls).toBe(1)
    })

    it('should return error state on API failure', async () => {
      server.use(errorHandlers.vaultList500)

      const { result } = renderHook(() => useIndexerData(), { wrapper: createWrapper() })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toBeDefined()
      expect(result.current.data).toBeUndefined()
    })
  })

  describe('useIndexerVaultData (single vault)', () => {
    it('should fetch vault data from shared cache', async () => {
      const { result } = renderHook(
        () => useIndexerVaultData({ vaultAddress: MOCK_VAULT_ADDRESS as Address }),
        { wrapper: createWrapper() },
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.data).toBeDefined()
      expect(result.current.data?.vaultName).toBe('Test Vault')
      expect(result.current.data?.supplyAPY).toBe(6.16) // totalApy from indexer
      expect(result.current.data?.baseAPY).toBe(3.5)
      expect(result.current.data?.intrinsicAPY).toBe(2.16)
      expect(result.current.data?.rewardAPY).toBe(0.5)
    })

    it('should return undefined for non-existent vault', async () => {
      const { result } = renderHook(
        () => useIndexerVaultData({ vaultAddress: '0x9999999999999999999999999999999999999999' as Address }),
        { wrapper: createWrapper() },
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.data).toBeUndefined()
    })
  })

  describe('useIndexerEarnVaultList', () => {
    it('should fetch and validate earn vault list', async () => {
      const { result } = renderHook(() => useIndexerEarnVaultList(), { wrapper: createWrapper() })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.vaults).toBeDefined()
      const vaults = result.current.vaults!
      expect(vaults).toHaveLength(1)
      // Use toLowerCase for comparison since getAddress normalizes to checksum format
      expect(vaults[0]!.toLowerCase()).toBe(MOCK_EARN_VAULT_ADDRESS.toLowerCase())
      expect(requestTracker.earnVaultListCalls).toBe(1)
    })

    it('should return error state on API failure', async () => {
      server.use(errorHandlers.earnVaultList500)

      const { result } = renderHook(() => useIndexerEarnVaultList(), { wrapper: createWrapper() })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toBeDefined()
    })
  })

  describe('useIndexerEarnVaultData', () => {
    it('should fetch and transform earn vault data', async () => {
      const { result } = renderHook(
        () => useIndexerEarnVaultData({ vaultAddress: MOCK_EARN_VAULT_ADDRESS as Address }),
        { wrapper: createWrapper() },
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.data).toBeDefined()
      const earnData = result.current.data!
      expect(earnData.vaultName).toBe('Test Earn Vault')
      expect(earnData.apy7d).toBe(5.25)
      expect(earnData.strategies).toHaveLength(1)
      expect(earnData.strategies![0]!.status).toBe('active')
      expect(requestTracker.earnVaultDetailCalls).toBe(1)
    })

    it('should return null for 404 responses', async () => {
      server.use(errorHandlers.earnVaultDetail404)

      const { result } = renderHook(
        () => useIndexerEarnVaultData({ vaultAddress: '0x0000000000000000000000000000000000000000' as Address }),
        { wrapper: createWrapper() },
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.data).toBeUndefined()
      expect(result.current.isError).toBe(false) // 404 is not an error
    })
  })

  describe('Zod validation', () => {
    it('should catch invalid API responses gracefully', async () => {
      // Add a handler that returns invalid data
      server.use(
        require('msw').http.post('https://indexer-test.example.com/v2/vault/list', () => {
          return require('msw').HttpResponse.json({
            // Missing required fields
            invalid: true,
          })
        }),
      )

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const { result } = renderHook(() => useIndexerData(), { wrapper: createWrapper() })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Should log warning about invalid response
      expect(consoleSpy).toHaveBeenCalled()
      expect(result.current.data).toBeUndefined()

      consoleSpy.mockRestore()
    })
  })

  describe('Cache sharing between hooks', () => {
    it('should make single API call when multiple hooks use same data', async () => {
      const wrapper = createWrapper()

      // First hook call
      const { result: result1 } = renderHook(() => useIndexerData(), { wrapper })

      await waitFor(() => {
        expect(result1.current.isLoading).toBe(false)
      })

      // Second hook using same query - should hit cache
      const { result: result2 } = renderHook(
        () => useIndexerVaultData({ vaultAddress: MOCK_VAULT_ADDRESS as Address }),
        { wrapper },
      )

      await waitFor(() => {
        expect(result2.current.isLoading).toBe(false)
      })

      // Both hooks should have data
      expect(result1.current.data).toBeDefined()
      expect(result2.current.data).toBeDefined()

      // Only one API call should have been made (cache hit for second)
      expect(requestTracker.vaultListCalls).toBe(1)
    })
  })
})
