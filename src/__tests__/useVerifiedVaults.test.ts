import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Address } from 'viem'
import { useVaultConfig } from '../context/useVaultConfig'
import { useVerifiedVaults } from '../hooks/useVerifiedVaults'
import { useReadContract } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import * as React from 'react'

// Mock dependencies
vi.mock('../context/useVaultConfig', () => ({
  useVaultConfig: vi.fn(),
}))

vi.mock('wagmi', () => ({
  useReadContract: vi.fn(),
}))

// Test data
const MOCK_PERSPECTIVE_ADDRESS = '0x4936Cd82936b6862fDD66CC8c36e1828127a6b57' as Address
const MOCK_VERIFIED_VAULTS = [
  '0xF73c654d468f5485bF15F3470B78851a49257704',
  '0x443100d1149D6d925Edb044248BBE32c5C7Ae955',
  '0x8A4545827DF5446Ba120B904e5306e58acCA4E89',
] as Address[]

const MOCK_CONFIG_WITH_PERSPECTIVE = {
  chainId: 999,
  usdUnitOfAccount: '0x0000000000000000000000000000000000000348' as Address,
  usdReferenceToken: '0xb8ce59fc3717ada4c02eadf9682a9e934f625ebb' as Address,
  governedPerspectiveAddress: MOCK_PERSPECTIVE_ADDRESS,
}

const MOCK_CONFIG_WITHOUT_PERSPECTIVE = {
  chainId: 999,
  usdUnitOfAccount: '0x0000000000000000000000000000000000000348' as Address,
  usdReferenceToken: '0xb8ce59fc3717ada4c02eadf9682a9e934f625ebb' as Address,
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
})

describe('useVerifiedVaults', () => {
  describe('when perspective is configured', () => {
    it('should fetch verified vaults from the perspective contract', async () => {
      vi.mocked(useVaultConfig).mockReturnValue(MOCK_CONFIG_WITH_PERSPECTIVE)
      vi.mocked(useReadContract).mockReturnValue({
        data: MOCK_VERIFIED_VAULTS,
        isLoading: false,
        isError: false,
        error: null,
      } as any)

      const { result } = renderHook(() => useVerifiedVaults(), { wrapper: createWrapper() })

      expect(result.current.isConfigured).toBe(true)
      expect(result.current.data).toEqual(MOCK_VERIFIED_VAULTS)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.isError).toBe(false)
    })

    it('should call useReadContract with correct parameters', async () => {
      vi.mocked(useVaultConfig).mockReturnValue(MOCK_CONFIG_WITH_PERSPECTIVE)
      vi.mocked(useReadContract).mockReturnValue({
        data: MOCK_VERIFIED_VAULTS,
        isLoading: false,
        isError: false,
        error: null,
      } as any)

      renderHook(() => useVerifiedVaults(), { wrapper: createWrapper() })

      expect(useReadContract).toHaveBeenCalledWith(
        expect.objectContaining({
          address: MOCK_PERSPECTIVE_ADDRESS,
          functionName: 'verifiedArray',
          chainId: 999,
        }),
      )
    })

    it('should return loading state while fetching', async () => {
      vi.mocked(useVaultConfig).mockReturnValue(MOCK_CONFIG_WITH_PERSPECTIVE)
      vi.mocked(useReadContract).mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        error: null,
      } as any)

      const { result } = renderHook(() => useVerifiedVaults(), { wrapper: createWrapper() })

      expect(result.current.isLoading).toBe(true)
      expect(result.current.data).toBeUndefined()
    })

    it('should handle errors', async () => {
      vi.mocked(useVaultConfig).mockReturnValue(MOCK_CONFIG_WITH_PERSPECTIVE)
      const mockError = new Error('Contract call failed')
      vi.mocked(useReadContract).mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        error: mockError,
      } as any)

      const { result } = renderHook(() => useVerifiedVaults(), { wrapper: createWrapper() })

      expect(result.current.isError).toBe(true)
      expect(result.current.error).toBe(mockError)
    })
  })

  describe('when perspective is not configured', () => {
    it('should return isConfigured as false', async () => {
      vi.mocked(useVaultConfig).mockReturnValue(MOCK_CONFIG_WITHOUT_PERSPECTIVE)
      vi.mocked(useReadContract).mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: false,
        error: null,
      } as any)

      const { result } = renderHook(() => useVerifiedVaults(), { wrapper: createWrapper() })

      expect(result.current.isConfigured).toBe(false)
      expect(result.current.data).toBeUndefined()
      expect(result.current.isLoading).toBe(false)
    })

    it('should not fetch data when perspective address is missing', async () => {
      vi.mocked(useVaultConfig).mockReturnValue(MOCK_CONFIG_WITHOUT_PERSPECTIVE)
      vi.mocked(useReadContract).mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: false,
        error: null,
      } as any)

      renderHook(() => useVerifiedVaults(), { wrapper: createWrapper() })

      expect(useReadContract).toHaveBeenCalledWith(
        expect.objectContaining({
          query: expect.objectContaining({
            enabled: false,
          }),
        }),
      )
    })
  })
})
