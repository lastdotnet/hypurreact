import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Address } from 'viem'
import { useVaultConfig } from '../context/useVaultConfig'
import { useVerifiedEarnVaults } from '../hooks/useVerifiedEarnVaults'
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
const MOCK_EARN_PERSPECTIVE_ADDRESS = '0x7b27dED9344D9c66FeAF58D151b52d1359aeA807' as Address
const MOCK_VERIFIED_EARN_VAULTS = [
  '0xF38eA9DE758a8F6be08B6E65bc0Ff2f3e3aB741b',
  '0xe8b10461ea0b04FF30F4cBfc3E93957Cac00DEd4',
  '0x6dd448d5cb73DC96788d5BE605DD3C5c83864a36',
] as Address[]

const MOCK_CONFIG_WITH_PERSPECTIVE = {
  chainId: 999,
  usdUnitOfAccount: '0x0000000000000000000000000000000000000348' as Address,
  usdReferenceToken: '0xb8ce59fc3717ada4c02eadf9682a9e934f625ebb' as Address,
  eulerEarnGovernedPerspectiveAddress: MOCK_EARN_PERSPECTIVE_ADDRESS,
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

describe('useVerifiedEarnVaults', () => {
  describe('when perspective is configured', () => {
    it('should fetch verified earn vaults from the perspective contract', async () => {
      vi.mocked(useVaultConfig).mockReturnValue(MOCK_CONFIG_WITH_PERSPECTIVE)
      vi.mocked(useReadContract).mockReturnValue({
        data: MOCK_VERIFIED_EARN_VAULTS,
        isLoading: false,
        isError: false,
        error: null,
      } as any)

      const { result } = renderHook(() => useVerifiedEarnVaults(), { wrapper: createWrapper() })

      expect(result.current.isConfigured).toBe(true)
      expect(result.current.data).toEqual(MOCK_VERIFIED_EARN_VAULTS)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.isError).toBe(false)
    })

    it('should call useReadContract with correct parameters', async () => {
      vi.mocked(useVaultConfig).mockReturnValue(MOCK_CONFIG_WITH_PERSPECTIVE)
      vi.mocked(useReadContract).mockReturnValue({
        data: MOCK_VERIFIED_EARN_VAULTS,
        isLoading: false,
        isError: false,
        error: null,
      } as any)

      renderHook(() => useVerifiedEarnVaults(), { wrapper: createWrapper() })

      expect(useReadContract).toHaveBeenCalledWith(
        expect.objectContaining({
          address: MOCK_EARN_PERSPECTIVE_ADDRESS,
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

      const { result } = renderHook(() => useVerifiedEarnVaults(), { wrapper: createWrapper() })

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

      const { result } = renderHook(() => useVerifiedEarnVaults(), { wrapper: createWrapper() })

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

      const { result } = renderHook(() => useVerifiedEarnVaults(), { wrapper: createWrapper() })

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

      renderHook(() => useVerifiedEarnVaults(), { wrapper: createWrapper() })

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
