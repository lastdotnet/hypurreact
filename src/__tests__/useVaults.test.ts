import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Address } from 'viem'
import { useVaults } from '../hooks/useVaults'
import { useVerifiedVaults } from '../hooks/useVerifiedVaults'
import { useIndexerVaultList } from '../hooks/useIndexerVaultList'
import { useVaultConfig } from '../context'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import * as React from 'react'

// Mock dependencies
vi.mock('../hooks/useVerifiedVaults', () => ({
  useVerifiedVaults: vi.fn(),
}))

vi.mock('../hooks/useIndexerVaultList', () => ({
  useIndexerVaultList: vi.fn(),
}))

vi.mock('../context', () => ({
  useVaultConfig: vi.fn(),
}))

// Test data
const GOVERNED_PERSPECTIVE = '0x4936Cd82936b6862fDD66CC8c36e1828127a6b57' as Address
const ALL_VAULTS = [
  '0xF73c654d468f5485bF15F3470B78851a49257704',
  '0x443100d1149D6d925Edb044248BBE32c5C7Ae955',
  '0x8A4545827DF5446Ba120B904e5306e58acCA4E89',
  '0xC200AaB602Cd7046389B5C8FB088884323F8dD0f',
  '0x28fCa2611d1Dd8109c26F748Cd2CF3BB4fC6D2cD',
] as Address[]

// Only first 3 are verified
const VERIFIED_VAULTS = [
  '0xF73c654d468f5485bF15F3470B78851a49257704',
  '0x443100d1149D6d925Edb044248BBE32c5C7Ae955',
  '0x8A4545827DF5446Ba120B904e5306e58acCA4E89',
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

// Helper to create indexer perspectives map (verified vaults have the governed perspective)
function createIndexerPerspectivesMap(verifiedVaults: Address[]): Map<string, Address[]> {
  const map = new Map<string, Address[]>()
  for (const vault of ALL_VAULTS) {
    const isVerified = verifiedVaults.some(v => v.toLowerCase() === vault.toLowerCase())
    map.set(vault.toLowerCase(), isVerified ? [GOVERNED_PERSPECTIVE] : [])
  }
  return map
}

beforeEach(() => {
  vi.clearAllMocks()

  // Default config mock
  vi.mocked(useVaultConfig).mockReturnValue({
    chainId: 999,
    usdUnitOfAccount: '0x0000000000000000000000000000000000000348' as Address,
    usdReferenceToken: '0xb8ce59fc3717ada4c02eadf9682a9e934f625ebb' as Address,
    governedPerspectiveAddress: GOVERNED_PERSPECTIVE,
  })
})

describe('useVaults', () => {
  describe('without verified filter', () => {
    it('should return all vaults when verified is false', () => {
      vi.mocked(useIndexerVaultList).mockReturnValue({
        data: createIndexerPerspectivesMap(VERIFIED_VAULTS),
        vaults: ALL_VAULTS,
        isLoading: false,
        isError: false,
        error: null,
      })

      vi.mocked(useVerifiedVaults).mockReturnValue({
        data: VERIFIED_VAULTS,
        isLoading: false,
        isError: false,
        error: null,
        isConfigured: true,
      })

      const { result } = renderHook(
        () => useVaults({ vaults: ALL_VAULTS, verified: false }),
        { wrapper: createWrapper() },
      )

      expect(result.current.vaults).toEqual(ALL_VAULTS)
      expect(result.current.count).toBe(5)
      expect(result.current.isVerifiedFilter).toBe(false)
      expect(result.current.isLoading).toBe(false)
    })

    it('should return all vaults by default', () => {
      vi.mocked(useIndexerVaultList).mockReturnValue({
        data: createIndexerPerspectivesMap(VERIFIED_VAULTS),
        vaults: ALL_VAULTS,
        isLoading: false,
        isError: false,
        error: null,
      })

      vi.mocked(useVerifiedVaults).mockReturnValue({
        data: VERIFIED_VAULTS,
        isLoading: false,
        isError: false,
        error: null,
        isConfigured: true,
      })

      const { result } = renderHook(
        () => useVaults({ vaults: ALL_VAULTS }),
        { wrapper: createWrapper() },
      )

      expect(result.current.vaults).toEqual(ALL_VAULTS)
      expect(result.current.count).toBe(5)
    })
  })

  describe('with verified filter using indexer', () => {
    it('should filter to only verified vaults using indexer perspectives', () => {
      vi.mocked(useIndexerVaultList).mockReturnValue({
        data: createIndexerPerspectivesMap(VERIFIED_VAULTS),
        vaults: ALL_VAULTS,
        isLoading: false,
        isError: false,
        error: null,
      })

      vi.mocked(useVerifiedVaults).mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: false,
        error: null,
        isConfigured: true,
      })

      const { result } = renderHook(
        () => useVaults({ vaults: ALL_VAULTS, verified: true }),
        { wrapper: createWrapper() },
      )

      expect(result.current.vaults).toHaveLength(3)
      expect(result.current.count).toBe(3)
      expect(result.current.isVerifiedFilter).toBe(true)
      expect(result.current.verificationSource).toBe('indexer')
      // Check that only verified vaults are returned
      result.current.vaults.forEach(vault => {
        expect(VERIFIED_VAULTS.map(v => v.toLowerCase())).toContain(vault.toLowerCase())
      })
    })

    it('should handle case-insensitive address comparison with indexer', () => {
      vi.mocked(useIndexerVaultList).mockReturnValue({
        data: createIndexerPerspectivesMap(VERIFIED_VAULTS),
        vaults: ALL_VAULTS,
        isLoading: false,
        isError: false,
        error: null,
      })

      vi.mocked(useVerifiedVaults).mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: false,
        error: null,
        isConfigured: true,
      })

      // Input vaults in original case
      const { result } = renderHook(
        () => useVaults({ vaults: ALL_VAULTS, verified: true }),
        { wrapper: createWrapper() },
      )

      // Should still match correctly
      expect(result.current.vaults).toHaveLength(3)
    })
  })

  describe('fallback to on-chain verification', () => {
    it('should use on-chain verifiedArray when indexer fails', () => {
      vi.mocked(useIndexerVaultList).mockReturnValue({
        data: undefined,
        vaults: undefined,
        isLoading: false,
        isError: true,
        error: new Error('Indexer failed'),
      })

      vi.mocked(useVerifiedVaults).mockReturnValue({
        data: VERIFIED_VAULTS,
        isLoading: false,
        isError: false,
        error: null,
        isConfigured: true,
      })

      const { result } = renderHook(
        () => useVaults({ vaults: ALL_VAULTS, verified: true }),
        { wrapper: createWrapper() },
      )

      expect(result.current.vaults).toHaveLength(3)
      expect(result.current.verificationSource).toBe('onchain')
    })

    it('should use on-chain verifiedArray when indexer returns no data', () => {
      vi.mocked(useIndexerVaultList).mockReturnValue({
        data: undefined,
        vaults: undefined,
        isLoading: false,
        isError: false,
        error: null,
      })

      vi.mocked(useVerifiedVaults).mockReturnValue({
        data: VERIFIED_VAULTS,
        isLoading: false,
        isError: false,
        error: null,
        isConfigured: true,
      })

      const { result } = renderHook(
        () => useVaults({ vaults: ALL_VAULTS, verified: true }),
        { wrapper: createWrapper() },
      )

      expect(result.current.vaults).toHaveLength(3)
      expect(result.current.verificationSource).toBe('onchain')
    })
  })

  describe('edge cases', () => {
    it('should return empty array when perspective not configured', () => {
      vi.mocked(useVaultConfig).mockReturnValue({
        chainId: 999,
        usdUnitOfAccount: '0x0000000000000000000000000000000000000348' as Address,
        usdReferenceToken: '0xb8ce59fc3717ada4c02eadf9682a9e934f625ebb' as Address,
        governedPerspectiveAddress: undefined,
      })

      vi.mocked(useIndexerVaultList).mockReturnValue({
        data: undefined,
        vaults: undefined,
        isLoading: false,
        isError: false,
        error: null,
      })

      vi.mocked(useVerifiedVaults).mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: false,
        error: null,
        isConfigured: false,
      })

      const { result } = renderHook(
        () => useVaults({ vaults: ALL_VAULTS, verified: true }),
        { wrapper: createWrapper() },
      )

      expect(result.current.vaults).toEqual([])
      expect(result.current.count).toBe(0)
      expect(result.current.isPerspectiveConfigured).toBe(false)
    })

    it('should handle empty vault list', () => {
      vi.mocked(useIndexerVaultList).mockReturnValue({
        data: createIndexerPerspectivesMap(VERIFIED_VAULTS),
        vaults: ALL_VAULTS,
        isLoading: false,
        isError: false,
        error: null,
      })

      vi.mocked(useVerifiedVaults).mockReturnValue({
        data: VERIFIED_VAULTS,
        isLoading: false,
        isError: false,
        error: null,
        isConfigured: true,
      })

      const { result } = renderHook(
        () => useVaults({ vaults: [], verified: true }),
        { wrapper: createWrapper() },
      )

      expect(result.current.vaults).toEqual([])
      expect(result.current.count).toBe(0)
    })

    it('should handle invalid addresses gracefully', () => {
      vi.mocked(useIndexerVaultList).mockReturnValue({
        data: createIndexerPerspectivesMap(VERIFIED_VAULTS),
        vaults: ALL_VAULTS,
        isLoading: false,
        isError: false,
        error: null,
      })

      vi.mocked(useVerifiedVaults).mockReturnValue({
        data: VERIFIED_VAULTS,
        isLoading: false,
        isError: false,
        error: null,
        isConfigured: true,
      })

      const vaultsWithInvalid = [...ALL_VAULTS, 'invalid-address' as Address]

      const { result } = renderHook(
        () => useVaults({ vaults: vaultsWithInvalid, verified: true }),
        { wrapper: createWrapper() },
      )

      // Should filter out invalid address without crashing
      // Only the 3 valid verified vaults should be returned
      expect(result.current.vaults.length).toBeLessThanOrEqual(3)
    })
  })
})
