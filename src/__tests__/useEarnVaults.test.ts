import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Address } from 'viem'
import { useEarnVaults } from '../hooks/useEarnVaults'
import { useVerifiedEarnVaults } from '../hooks/useVerifiedEarnVaults'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import * as React from 'react'

// Mock dependencies
vi.mock('../hooks/useVerifiedEarnVaults', () => ({
  useVerifiedEarnVaults: vi.fn(),
}))

// Test data
const ALL_EARN_VAULTS = [
  '0xF38eA9DE758a8F6be08B6E65bc0Ff2f3e3aB741b',
  '0xe8b10461ea0b04FF30F4cBfc3E93957Cac00DEd4',
  '0x6dd448d5cb73DC96788d5BE605DD3C5c83864a36',
  '0xF868A2B30854FE13e26F7AB7a92609cCb6b9c0e1',
  '0xunverified1111111111111111111111111111111',
] as Address[]

// Only first 4 are verified
const VERIFIED_EARN_VAULTS = [
  '0xF38eA9DE758a8F6be08B6E65bc0Ff2f3e3aB741b',
  '0xe8b10461ea0b04FF30F4cBfc3E93957Cac00DEd4',
  '0x6dd448d5cb73DC96788d5BE605DD3C5c83864a36',
  '0xF868A2B30854FE13e26F7AB7a92609cCb6b9c0e1',
] as Address[]

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
})

describe('useEarnVaults', () => {
  describe('without verified filter', () => {
    it('should return all vaults when verified is false', () => {
      vi.mocked(useVerifiedEarnVaults).mockReturnValue({
        data: VERIFIED_EARN_VAULTS,
        isLoading: false,
        isError: false,
        error: null,
        isConfigured: true,
      })

      const { result } = renderHook(
        () => useEarnVaults({ vaults: ALL_EARN_VAULTS, verified: false }),
        { wrapper: createWrapper() },
      )

      expect(result.current.vaults).toEqual(ALL_EARN_VAULTS)
      expect(result.current.count).toBe(5)
      expect(result.current.isVerifiedFilter).toBe(false)
      expect(result.current.isLoading).toBe(false)
    })

    it('should return all vaults by default', () => {
      vi.mocked(useVerifiedEarnVaults).mockReturnValue({
        data: VERIFIED_EARN_VAULTS,
        isLoading: false,
        isError: false,
        error: null,
        isConfigured: true,
      })

      const { result } = renderHook(
        () => useEarnVaults({ vaults: ALL_EARN_VAULTS }),
        { wrapper: createWrapper() },
      )

      expect(result.current.vaults).toEqual(ALL_EARN_VAULTS)
      expect(result.current.count).toBe(5)
    })
  })

  describe('with verified filter', () => {
    it('should filter to only verified vaults when verified is true', () => {
      vi.mocked(useVerifiedEarnVaults).mockReturnValue({
        data: VERIFIED_EARN_VAULTS,
        isLoading: false,
        isError: false,
        error: null,
        isConfigured: true,
      })

      const { result } = renderHook(
        () => useEarnVaults({ vaults: ALL_EARN_VAULTS, verified: true }),
        { wrapper: createWrapper() },
      )

      expect(result.current.vaults).toHaveLength(4)
      expect(result.current.count).toBe(4)
      expect(result.current.isVerifiedFilter).toBe(true)
      // Check that only verified vaults are returned
      result.current.vaults.forEach(vault => {
        expect(VERIFIED_EARN_VAULTS.map(v => v.toLowerCase())).toContain(vault.toLowerCase())
      })
    })

    it('should handle case-insensitive address comparison', () => {
      // Return verified vaults in lowercase
      vi.mocked(useVerifiedEarnVaults).mockReturnValue({
        data: VERIFIED_EARN_VAULTS.map(v => v.toLowerCase()) as Address[],
        isLoading: false,
        isError: false,
        error: null,
        isConfigured: true,
      })

      // Input vaults in original case
      const { result } = renderHook(
        () => useEarnVaults({ vaults: ALL_EARN_VAULTS, verified: true }),
        { wrapper: createWrapper() },
      )

      // Should still match correctly
      expect(result.current.vaults).toHaveLength(4)
    })

    it('should return empty array when perspective not configured', () => {
      vi.mocked(useVerifiedEarnVaults).mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: false,
        error: null,
        isConfigured: false,
      })

      const { result } = renderHook(
        () => useEarnVaults({ vaults: ALL_EARN_VAULTS, verified: true }),
        { wrapper: createWrapper() },
      )

      expect(result.current.vaults).toEqual([])
      expect(result.current.count).toBe(0)
      expect(result.current.isPerspectiveConfigured).toBe(false)
    })

    it('should return empty array while loading', () => {
      vi.mocked(useVerifiedEarnVaults).mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        error: null,
        isConfigured: true,
      })

      const { result } = renderHook(
        () => useEarnVaults({ vaults: ALL_EARN_VAULTS, verified: true }),
        { wrapper: createWrapper() },
      )

      expect(result.current.vaults).toEqual([])
      expect(result.current.isLoading).toBe(true)
    })

    it('should provide verifiedSet for external use', () => {
      vi.mocked(useVerifiedEarnVaults).mockReturnValue({
        data: VERIFIED_EARN_VAULTS,
        isLoading: false,
        isError: false,
        error: null,
        isConfigured: true,
      })

      const { result } = renderHook(
        () => useEarnVaults({ vaults: ALL_EARN_VAULTS, verified: false }),
        { wrapper: createWrapper() },
      )

      expect(result.current.verifiedSet.size).toBe(4)
      // Check lowercase normalization
      expect(result.current.verifiedSet.has(VERIFIED_EARN_VAULTS[0]!.toLowerCase())).toBe(true)
    })
  })

  describe('edge cases', () => {
    it('should handle empty vault list', () => {
      vi.mocked(useVerifiedEarnVaults).mockReturnValue({
        data: VERIFIED_EARN_VAULTS,
        isLoading: false,
        isError: false,
        error: null,
        isConfigured: true,
      })

      const { result } = renderHook(
        () => useEarnVaults({ vaults: [], verified: true }),
        { wrapper: createWrapper() },
      )

      expect(result.current.vaults).toEqual([])
      expect(result.current.count).toBe(0)
    })

    it('should handle empty verified list', () => {
      vi.mocked(useVerifiedEarnVaults).mockReturnValue({
        data: [],
        isLoading: false,
        isError: false,
        error: null,
        isConfigured: true,
      })

      const { result } = renderHook(
        () => useEarnVaults({ vaults: ALL_EARN_VAULTS, verified: true }),
        { wrapper: createWrapper() },
      )

      expect(result.current.vaults).toEqual([])
      expect(result.current.count).toBe(0)
    })

    it('should handle invalid addresses gracefully', () => {
      vi.mocked(useVerifiedEarnVaults).mockReturnValue({
        data: VERIFIED_EARN_VAULTS,
        isLoading: false,
        isError: false,
        error: null,
        isConfigured: true,
      })

      const vaultsWithInvalid = [...ALL_EARN_VAULTS, 'invalid-address' as Address]

      const { result } = renderHook(
        () => useEarnVaults({ vaults: vaultsWithInvalid, verified: true }),
        { wrapper: createWrapper() },
      )

      // Should filter out invalid address without crashing
      // Only the 4 valid verified vaults should be returned
      expect(result.current.vaults.length).toBeLessThanOrEqual(4)
    })
  })
})
