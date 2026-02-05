import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useReadContracts } from 'wagmi'
import { useVaultConfig } from '../context/useVaultConfig'
import { useIndexerPrices } from '../hooks/useIndexerPrices'
import { usePrice } from '../hooks/usePrice'
import { useVaultOraclePrice } from '../hooks/useVaultOraclePrice'

// Mock dependencies
vi.mock('wagmi', () => ({
  useReadContracts: vi.fn(),
  useReadContract: vi.fn(),
}))

vi.mock('../context/useVaultConfig', () => ({
  useVaultConfig: vi.fn(),
}))

vi.mock('../hooks/useVaultOraclePrice', () => ({
  useVaultOraclePrice: vi.fn(),
}))

vi.mock('../hooks/useIndexerPrices', () => ({
  useIndexerPrices: vi.fn(),
}))

// Test data
const MOCK_ASSET_ADDRESS = '0x1234567890123456789012345678901234567890' as const
const MOCK_VAULT_ADDRESS = '0x0987654321098765432109876543210987654321' as const
const MOCK_ORACLE_ADDRESS = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd' as const
const MOCK_UNIT_OF_ACCOUNT = '0xfedcbafedcbafedcbafedcbafedcbafedcbafed' as const
const MOCK_USD_UNIT_OF_ACCOUNT = '0x0000000000000000000000000000000000000348' as const
const MOCK_USD_REFERENCE_TOKEN = '0xb8ce59fc3717ada4c02eadf9682a9e934f625ebb' as const

const MOCK_CONFIG = {
  chainId: 1,
  usdUnitOfAccount: MOCK_USD_UNIT_OF_ACCOUNT,
  usdReferenceToken: MOCK_USD_REFERENCE_TOKEN,
}

const MOCK_VAULT_ORACLE_RESULT = {
  priceUSD: 1234.56,
  isLoading: false,
  isError: false,
  error: null,
  source: 'onchain' as const,
}

const MOCK_INDEXER_PRICES_RESULT = {
  data: {} as Record<`0x${string}`, number | null> | undefined,
  isLoading: false,
  isError: false,
  isSuccess: true,
  error: null,
}

beforeEach(() => {
  vi.clearAllMocks()
  // Default mock for useIndexerPrices - empty indexer data (no prices)
  vi.mocked(useIndexerPrices).mockReturnValue(MOCK_INDEXER_PRICES_RESULT)
})

describe('usePrice', () => {
  describe('returns indexer price when available', () => {
    it('should return indexer price with source "indexer" when indexer has vault price', async () => {
      const indexerPrice = 999.99

      // Mock indexer returning price for the vault
      vi.mocked(useIndexerPrices).mockReturnValue({
        data: { [MOCK_VAULT_ADDRESS]: indexerPrice },
        isLoading: false,
        isError: false,
        isSuccess: true,
        error: null,
      })

      vi.mocked(useVaultConfig).mockReturnValue(MOCK_CONFIG)
      vi.mocked(useReadContracts).mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: false,
        error: null,
        status: 'success',
        isPending: false,
        isSuccess: true,
        isFetched: true,
        isFetching: false,
        isRefetching: false,
        isLoadingError: false,
        isPaused: false,
        failureCount: 0,
        failureReason: null,
        dataUpdatedAt: 0,
        errorUpdatedAt: 0,
        refetch: vi.fn(),
      } as any)

      vi.mocked(useVaultOraclePrice).mockReturnValue(MOCK_VAULT_ORACLE_RESULT)

      const { result } = renderHook(() =>
        usePrice({
          assetAddress: MOCK_ASSET_ADDRESS,
          vaultAddress: MOCK_VAULT_ADDRESS,
          oracleAddress: MOCK_ORACLE_ADDRESS,
          unitOfAccount: MOCK_UNIT_OF_ACCOUNT,
        }),
      )

      expect(result.current.priceUSD).toBe(indexerPrice)
      expect(result.current.source).toBe('indexer')
      expect(result.current.isLoading).toBe(false)
      expect(result.current.isError).toBe(false)
    })
  })

  describe('falls back to onchain when no indexer price', () => {
    it('should fetch onchain price when indexer price not provided', async () => {
      vi.mocked(useVaultConfig).mockReturnValue(MOCK_CONFIG)
      vi.mocked(useReadContracts).mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: false,
        error: null,
        status: 'success',
        isPending: false,
        isSuccess: true,
        isFetched: true,
        isFetching: false,
        isRefetching: false,
        isLoadingError: false,
        isPaused: false,
        failureCount: 0,
        failureReason: null,
        dataUpdatedAt: 0,
        errorUpdatedAt: 0,
        refetch: vi.fn(),
      } as any)

      vi.mocked(useVaultOraclePrice).mockReturnValue(MOCK_VAULT_ORACLE_RESULT)

      const { result } = renderHook(() =>
        usePrice({
          assetAddress: MOCK_ASSET_ADDRESS,
          oracleAddress: MOCK_ORACLE_ADDRESS,
          unitOfAccount: MOCK_UNIT_OF_ACCOUNT,
        }),
      )

      expect(result.current.priceUSD).toBe(MOCK_VAULT_ORACLE_RESULT.priceUSD)
      expect(result.current.source).toBe('vaultOracle')
      expect(result.current.isLoading).toBe(false)
      expect(result.current.isError).toBe(false)
    })
  })

  describe('auto-fetches oracle/unitOfAccount/asset from vault', () => {
    it('should fetch oracle, unitOfAccount, and asset from vault when only vaultAddress provided', async () => {
      const mockVaultConfigData = [
        { result: MOCK_ORACLE_ADDRESS, status: 'success' },
        { result: MOCK_UNIT_OF_ACCOUNT, status: 'success' },
        { result: MOCK_ASSET_ADDRESS, status: 'success' },
      ]

      vi.mocked(useVaultConfig).mockReturnValue(MOCK_CONFIG)
      vi.mocked(useReadContracts).mockReturnValue({
        data: mockVaultConfigData,
        isLoading: false,
        isError: false,
        error: null,
        status: 'success',
        isPending: false,
        isSuccess: true,
        isFetched: true,
        isFetching: false,
        isRefetching: false,
        isLoadingError: false,
        isPaused: false,
        failureCount: 0,
        failureReason: null,
        dataUpdatedAt: 0,
        errorUpdatedAt: 0,
        refetch: vi.fn(),
      } as any)

      vi.mocked(useVaultOraclePrice).mockReturnValue(MOCK_VAULT_ORACLE_RESULT)

      const { result } = renderHook(() =>
        usePrice({
          vaultAddress: MOCK_VAULT_ADDRESS,
        }),
      )

      // Verify useReadContracts was called to fetch vault config
      expect(useReadContracts).toHaveBeenCalled()

      // Verify useVaultOraclePrice was called with ALL fetched values including asset
      expect(useVaultOraclePrice).toHaveBeenCalledWith(
        expect.objectContaining({
          assetAddress: MOCK_ASSET_ADDRESS,
          oracleAddress: MOCK_ORACLE_ADDRESS,
          unitOfAccount: MOCK_UNIT_OF_ACCOUNT,
        }),
      )

      expect(result.current.priceUSD).toBe(MOCK_VAULT_ORACLE_RESULT.priceUSD)
    })

    it('should use provided assetAddress instead of fetching from vault', async () => {
      const providedAssetAddress = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' as const
      const mockVaultConfigData = [
        { result: MOCK_ORACLE_ADDRESS, status: 'success' },
        { result: MOCK_UNIT_OF_ACCOUNT, status: 'success' },
        { result: MOCK_ASSET_ADDRESS, status: 'success' },
      ]

      vi.mocked(useVaultConfig).mockReturnValue(MOCK_CONFIG)
      vi.mocked(useReadContracts).mockReturnValue({
        data: mockVaultConfigData,
        isLoading: false,
        isError: false,
        error: null,
        status: 'success',
        isPending: false,
        isSuccess: true,
        isFetched: true,
        isFetching: false,
        isRefetching: false,
        isLoadingError: false,
        isPaused: false,
        failureCount: 0,
        failureReason: null,
        dataUpdatedAt: 0,
        errorUpdatedAt: 0,
        refetch: vi.fn(),
      } as any)

      vi.mocked(useVaultOraclePrice).mockReturnValue(MOCK_VAULT_ORACLE_RESULT)

      renderHook(() =>
        usePrice({
          assetAddress: providedAssetAddress,
          vaultAddress: MOCK_VAULT_ADDRESS,
        }),
      )

      // Should use provided assetAddress, not the one from vault
      expect(useVaultOraclePrice).toHaveBeenCalledWith(
        expect.objectContaining({
          assetAddress: providedAssetAddress,
        }),
      )
    })

    it('should not fetch vault config when oracle/unitOfAccount already provided', async () => {
      vi.mocked(useVaultConfig).mockReturnValue(MOCK_CONFIG)
      vi.mocked(useReadContracts).mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: false,
        error: null,
        status: 'success',
        isPending: false,
        isSuccess: true,
        isFetched: true,
        isFetching: false,
        isRefetching: false,
        isLoadingError: false,
        isPaused: false,
        failureCount: 0,
        failureReason: null,
        dataUpdatedAt: 0,
        errorUpdatedAt: 0,
        refetch: vi.fn(),
      } as any)

      vi.mocked(useVaultOraclePrice).mockReturnValue(MOCK_VAULT_ORACLE_RESULT)

      renderHook(() =>
        usePrice({
          assetAddress: MOCK_ASSET_ADDRESS,
          vaultAddress: MOCK_VAULT_ADDRESS,
          oracleAddress: MOCK_ORACLE_ADDRESS,
          unitOfAccount: MOCK_UNIT_OF_ACCOUNT,
        }),
      )

      // Verify useReadContracts was called with enabled: false
      const callArgs = vi.mocked(useReadContracts).mock.calls[0]?.[0]
      expect(callArgs?.query?.enabled).toBe(false)
    })
  })

  describe('handles loading states correctly', () => {
    it('should indicate loading when vault config is being fetched', async () => {
      vi.mocked(useVaultConfig).mockReturnValue(MOCK_CONFIG)
      vi.mocked(useReadContracts).mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        error: null,
        status: 'pending',
        isPending: true,
        isSuccess: false,
        isFetched: false,
        isFetching: true,
        isRefetching: false,
        isLoadingError: false,
        isPaused: false,
        failureCount: 0,
        failureReason: null,
        dataUpdatedAt: 0,
        errorUpdatedAt: 0,
        refetch: vi.fn(),
      } as any)

      vi.mocked(useVaultOraclePrice).mockReturnValue({
        ...MOCK_VAULT_ORACLE_RESULT,
        isLoading: false,
      })

      const { result } = renderHook(() =>
        usePrice({
          assetAddress: MOCK_ASSET_ADDRESS,
          vaultAddress: MOCK_VAULT_ADDRESS,
        }),
      )

      expect(result.current.isLoading).toBe(true)
    })

    it('should indicate loading when vault oracle price is being fetched', async () => {
      vi.mocked(useVaultConfig).mockReturnValue(MOCK_CONFIG)
      vi.mocked(useReadContracts).mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: false,
        error: null,
        status: 'success',
        isPending: false,
        isSuccess: true,
        isFetched: true,
        isFetching: false,
        isRefetching: false,
        isLoadingError: false,
        isPaused: false,
        failureCount: 0,
        failureReason: null,
        dataUpdatedAt: 0,
        errorUpdatedAt: 0,
        refetch: vi.fn(),
      } as any)

      vi.mocked(useVaultOraclePrice).mockReturnValue({
        ...MOCK_VAULT_ORACLE_RESULT,
        isLoading: true,
      })

      const { result } = renderHook(() =>
        usePrice({
          assetAddress: MOCK_ASSET_ADDRESS,
          oracleAddress: MOCK_ORACLE_ADDRESS,
          unitOfAccount: MOCK_UNIT_OF_ACCOUNT,
        }),
      )

      expect(result.current.isLoading).toBe(true)
    })
  })

  describe('handles error states', () => {
    it('should propagate vault config fetch errors', async () => {
      const mockError = new Error('Vault config fetch failed')

      vi.mocked(useVaultConfig).mockReturnValue(MOCK_CONFIG)
      vi.mocked(useReadContracts).mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        error: mockError,
        status: 'error',
        isPending: false,
        isSuccess: false,
        isFetched: true,
        isFetching: false,
        isRefetching: false,
        isLoadingError: true,
        isPaused: false,
        failureCount: 1,
        failureReason: mockError,
        dataUpdatedAt: 0,
        errorUpdatedAt: Date.now(),
        refetch: vi.fn(),
      } as any)

      vi.mocked(useVaultOraclePrice).mockReturnValue({
        ...MOCK_VAULT_ORACLE_RESULT,
        isError: false,
      })

      const { result } = renderHook(() =>
        usePrice({
          assetAddress: MOCK_ASSET_ADDRESS,
          vaultAddress: MOCK_VAULT_ADDRESS,
        }),
      )

      expect(result.current.isError).toBe(true)
      expect(result.current.error).toBe(mockError)
    })

    it('should propagate vault oracle price fetch errors', async () => {
      const mockError = new Error('Oracle price fetch failed')

      vi.mocked(useVaultConfig).mockReturnValue(MOCK_CONFIG)
      vi.mocked(useReadContracts).mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: false,
        error: null,
        status: 'success',
        isPending: false,
        isSuccess: true,
        isFetched: true,
        isFetching: false,
        isRefetching: false,
        isLoadingError: false,
        isPaused: false,
        failureCount: 0,
        failureReason: null,
        dataUpdatedAt: 0,
        errorUpdatedAt: 0,
        refetch: vi.fn(),
      } as any)

      vi.mocked(useVaultOraclePrice).mockReturnValue({
        ...MOCK_VAULT_ORACLE_RESULT,
        isError: true,
        error: mockError,
      })

      const { result } = renderHook(() =>
        usePrice({
          assetAddress: MOCK_ASSET_ADDRESS,
          oracleAddress: MOCK_ORACLE_ADDRESS,
          unitOfAccount: MOCK_UNIT_OF_ACCOUNT,
        }),
      )

      expect(result.current.isError).toBe(true)
      expect(result.current.error).toBe(mockError)
    })

    it('should prioritize vault config error over oracle price error', async () => {
      const vaultConfigError = new Error('Vault config error')
      const oraclePriceError = new Error('Oracle price error')

      vi.mocked(useVaultConfig).mockReturnValue(MOCK_CONFIG)
      vi.mocked(useReadContracts).mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        error: vaultConfigError,
        status: 'error',
        isPending: false,
        isSuccess: false,
        isFetched: true,
        isFetching: false,
        isRefetching: false,
        isLoadingError: true,
        isPaused: false,
        failureCount: 1,
        failureReason: vaultConfigError,
        dataUpdatedAt: 0,
        errorUpdatedAt: Date.now(),
        refetch: vi.fn(),
      } as any)

      vi.mocked(useVaultOraclePrice).mockReturnValue({
        ...MOCK_VAULT_ORACLE_RESULT,
        isError: true,
        error: oraclePriceError,
      })

      const { result } = renderHook(() =>
        usePrice({
          assetAddress: MOCK_ASSET_ADDRESS,
          vaultAddress: MOCK_VAULT_ADDRESS,
        }),
      )

      expect(result.current.error).toBe(vaultConfigError)
    })
  })

  describe('uses config from context', () => {
    it('should use context config when no override provided', async () => {
      vi.mocked(useVaultConfig).mockReturnValue(MOCK_CONFIG)
      vi.mocked(useReadContracts).mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: false,
        error: null,
        status: 'success',
        isPending: false,
        isSuccess: true,
        isFetched: true,
        isFetching: false,
        isRefetching: false,
        isLoadingError: false,
        isPaused: false,
        failureCount: 0,
        failureReason: null,
        dataUpdatedAt: 0,
        errorUpdatedAt: 0,
        refetch: vi.fn(),
      } as any)

      vi.mocked(useVaultOraclePrice).mockReturnValue(MOCK_VAULT_ORACLE_RESULT)

      renderHook(() =>
        usePrice({
          assetAddress: MOCK_ASSET_ADDRESS,
          oracleAddress: MOCK_ORACLE_ADDRESS,
          unitOfAccount: MOCK_UNIT_OF_ACCOUNT,
        }),
      )

      // Verify useVaultConfig was called
      expect(useVaultConfig).toHaveBeenCalled()

      // Verify useVaultOraclePrice was called with context config
      expect(useVaultOraclePrice).toHaveBeenCalledWith(
        expect.objectContaining({
          config: MOCK_CONFIG,
        }),
      )
    })
  })

  describe('allows config override per-hook', () => {
    it('should use override config instead of context config', async () => {
      const contextConfig = MOCK_CONFIG
      const overrideConfig = {
        ...MOCK_CONFIG,
        chainId: 137, // Polygon
      }

      vi.mocked(useVaultConfig).mockReturnValue(contextConfig)
      vi.mocked(useReadContracts).mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: false,
        error: null,
        status: 'success',
        isPending: false,
        isSuccess: true,
        isFetched: true,
        isFetching: false,
        isRefetching: false,
        isLoadingError: false,
        isPaused: false,
        failureCount: 0,
        failureReason: null,
        dataUpdatedAt: 0,
        errorUpdatedAt: 0,
        refetch: vi.fn(),
      } as any)

      vi.mocked(useVaultOraclePrice).mockReturnValue(MOCK_VAULT_ORACLE_RESULT)

      renderHook(() =>
        usePrice({
          assetAddress: MOCK_ASSET_ADDRESS,
          oracleAddress: MOCK_ORACLE_ADDRESS,
          unitOfAccount: MOCK_UNIT_OF_ACCOUNT,
          config: overrideConfig,
        }),
      )

      // Verify useVaultOraclePrice was called with override config
      expect(useVaultOraclePrice).toHaveBeenCalledWith(
        expect.objectContaining({
          config: overrideConfig,
        }),
      )
    })
  })

  describe('maps source correctly', () => {
    it('should map "onchain" source to "vaultOracle"', async () => {
      vi.mocked(useVaultConfig).mockReturnValue(MOCK_CONFIG)
      vi.mocked(useReadContracts).mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: false,
        error: null,
        status: 'success',
        isPending: false,
        isSuccess: true,
        isFetched: true,
        isFetching: false,
        isRefetching: false,
        isLoadingError: false,
        isPaused: false,
        failureCount: 0,
        failureReason: null,
        dataUpdatedAt: 0,
        errorUpdatedAt: 0,
        refetch: vi.fn(),
      } as any)

      vi.mocked(useVaultOraclePrice).mockReturnValue({
        ...MOCK_VAULT_ORACLE_RESULT,
        source: 'onchain',
      })

      const { result } = renderHook(() =>
        usePrice({
          assetAddress: MOCK_ASSET_ADDRESS,
          oracleAddress: MOCK_ORACLE_ADDRESS,
          unitOfAccount: MOCK_UNIT_OF_ACCOUNT,
        }),
      )

      expect(result.current.source).toBe('vaultOracle')
    })

    it('should return "indexer" source when indexer has price for vault', async () => {
      const indexerPrice = 1234.56

      // Mock indexer returning price for the vault
      vi.mocked(useIndexerPrices).mockReturnValue({
        data: { [MOCK_VAULT_ADDRESS]: indexerPrice },
        isLoading: false,
        isError: false,
        isSuccess: true,
        error: null,
      })

      vi.mocked(useVaultConfig).mockReturnValue(MOCK_CONFIG)
      vi.mocked(useReadContracts).mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: false,
        error: null,
        status: 'success',
        isPending: false,
        isSuccess: true,
        isFetched: true,
        isFetching: false,
        isRefetching: false,
        isLoadingError: false,
        isPaused: false,
        failureCount: 0,
        failureReason: null,
        dataUpdatedAt: 0,
        errorUpdatedAt: 0,
        refetch: vi.fn(),
      } as any)

      vi.mocked(useVaultOraclePrice).mockReturnValue(MOCK_VAULT_ORACLE_RESULT)

      const { result } = renderHook(() =>
        usePrice({
          assetAddress: MOCK_ASSET_ADDRESS,
          vaultAddress: MOCK_VAULT_ADDRESS,
          oracleAddress: MOCK_ORACLE_ADDRESS,
          unitOfAccount: MOCK_UNIT_OF_ACCOUNT,
        }),
      )

      expect(result.current.priceUSD).toBe(indexerPrice)
      expect(result.current.source).toBe('indexer')
    })

    it('should map "none" source to "none"', async () => {
      vi.mocked(useVaultConfig).mockReturnValue(MOCK_CONFIG)
      vi.mocked(useReadContracts).mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: false,
        error: null,
        status: 'success',
        isPending: false,
        isSuccess: true,
        isFetched: true,
        isFetching: false,
        isRefetching: false,
        isLoadingError: false,
        isPaused: false,
        failureCount: 0,
        failureReason: null,
        dataUpdatedAt: 0,
        errorUpdatedAt: 0,
        refetch: vi.fn(),
      } as any)

      vi.mocked(useVaultOraclePrice).mockReturnValue({
        ...MOCK_VAULT_ORACLE_RESULT,
        source: 'none',
        priceUSD: 0,
      })

      const { result } = renderHook(() =>
        usePrice({
          assetAddress: MOCK_ASSET_ADDRESS,
          oracleAddress: MOCK_ORACLE_ADDRESS,
          unitOfAccount: MOCK_UNIT_OF_ACCOUNT,
        }),
      )

      expect(result.current.source).toBe('none')
    })
  })

  describe('respects enabled flag', () => {
    it('should not fetch when enabled is false', async () => {
      vi.mocked(useVaultConfig).mockReturnValue(MOCK_CONFIG)
      vi.mocked(useReadContracts).mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: false,
        error: null,
        status: 'success',
        isPending: false,
        isSuccess: true,
        isFetched: true,
        isFetching: false,
        isRefetching: false,
        isLoadingError: false,
        isPaused: false,
        failureCount: 0,
        failureReason: null,
        dataUpdatedAt: 0,
        errorUpdatedAt: 0,
        refetch: vi.fn(),
      } as any)

      vi.mocked(useVaultOraclePrice).mockReturnValue({
        ...MOCK_VAULT_ORACLE_RESULT,
        isLoading: false,
      })

      renderHook(() =>
        usePrice({
          assetAddress: MOCK_ASSET_ADDRESS,
          vaultAddress: MOCK_VAULT_ADDRESS,
          enabled: false,
        }),
      )

      // Verify useReadContracts was called with enabled: false
      const callArgs = vi.mocked(useReadContracts).mock.calls[0]?.[0]
      expect(callArgs?.query?.enabled).toBe(false)
    })
  })

  describe('uses chainId from params or context', () => {
    it('should use provided chainId over context chainId', async () => {
      const contextConfig = { ...MOCK_CONFIG, chainId: 1 }
      const providedChainId = 137

      vi.mocked(useVaultConfig).mockReturnValue(contextConfig)
      vi.mocked(useReadContracts).mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: false,
        error: null,
        status: 'success',
        isPending: false,
        isSuccess: true,
        isFetched: true,
        isFetching: false,
        isRefetching: false,
        isLoadingError: false,
        isPaused: false,
        failureCount: 0,
        failureReason: null,
        dataUpdatedAt: 0,
        errorUpdatedAt: 0,
        refetch: vi.fn(),
      } as any)

      vi.mocked(useVaultOraclePrice).mockReturnValue(MOCK_VAULT_ORACLE_RESULT)

      renderHook(() =>
        usePrice({
          assetAddress: MOCK_ASSET_ADDRESS,
          oracleAddress: MOCK_ORACLE_ADDRESS,
          unitOfAccount: MOCK_UNIT_OF_ACCOUNT,
          chainId: providedChainId,
        }),
      )

      // Verify useVaultOraclePrice was called with provided chainId
      expect(useVaultOraclePrice).toHaveBeenCalledWith(
        expect.objectContaining({
          chainId: providedChainId,
        }),
      )
    })

    it('should use context chainId when not provided', async () => {
      const contextConfig = { ...MOCK_CONFIG, chainId: 1 }

      vi.mocked(useVaultConfig).mockReturnValue(contextConfig)
      vi.mocked(useReadContracts).mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: false,
        error: null,
        status: 'success',
        isPending: false,
        isSuccess: true,
        isFetched: true,
        isFetching: false,
        isRefetching: false,
        isLoadingError: false,
        isPaused: false,
        failureCount: 0,
        failureReason: null,
        dataUpdatedAt: 0,
        errorUpdatedAt: 0,
        refetch: vi.fn(),
      } as any)

      vi.mocked(useVaultOraclePrice).mockReturnValue(MOCK_VAULT_ORACLE_RESULT)

      renderHook(() =>
        usePrice({
          assetAddress: MOCK_ASSET_ADDRESS,
          oracleAddress: MOCK_ORACLE_ADDRESS,
          unitOfAccount: MOCK_UNIT_OF_ACCOUNT,
        }),
      )

      // Verify useVaultOraclePrice was called with context chainId
      expect(useVaultOraclePrice).toHaveBeenCalledWith(
        expect.objectContaining({
          chainId: contextConfig.chainId,
        }),
      )
    })
  })

  describe('lazy loading - skips vault config fetch when indexer has price', () => {
    it('should NOT fetch vault config when indexer has the price', async () => {
      const indexerPrice = 1.0001

      vi.mocked(useIndexerPrices).mockReturnValue({
        data: { [MOCK_VAULT_ADDRESS]: indexerPrice },
        isLoading: false,
        isError: false,
        isSuccess: true,
        error: null,
      })

      vi.mocked(useVaultConfig).mockReturnValue(MOCK_CONFIG)
      vi.mocked(useReadContracts).mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: false,
        error: null,
        status: 'success',
        isPending: false,
        isSuccess: true,
        isFetched: true,
        isFetching: false,
        isRefetching: false,
        isLoadingError: false,
        isPaused: false,
        failureCount: 0,
        failureReason: null,
        dataUpdatedAt: 0,
        errorUpdatedAt: 0,
        refetch: vi.fn(),
      } as any)

      vi.mocked(useVaultOraclePrice).mockReturnValue(MOCK_VAULT_ORACLE_RESULT)

      const { result } = renderHook(() =>
        usePrice({
          vaultAddress: MOCK_VAULT_ADDRESS,
        }),
      )

      // Should return indexer price
      expect(result.current.priceUSD).toBe(indexerPrice)
      expect(result.current.source).toBe('indexer')

      // Vault config fetch should be disabled (enabled: false)
      const callArgs = vi.mocked(useReadContracts).mock.calls[0]?.[0]
      expect(callArgs?.query?.enabled).toBe(false)
    })

    it('should fetch vault config when indexer has no price for this vault', async () => {
      vi.mocked(useIndexerPrices).mockReturnValue({
        data: {},
        isLoading: false,
        isError: false,
        isSuccess: true,
        error: null,
      })

      vi.mocked(useVaultConfig).mockReturnValue(MOCK_CONFIG)
      vi.mocked(useReadContracts).mockReturnValue({
        data: [
          { result: MOCK_ORACLE_ADDRESS, status: 'success' },
          { result: MOCK_UNIT_OF_ACCOUNT, status: 'success' },
          { result: MOCK_ASSET_ADDRESS, status: 'success' },
        ],
        isLoading: false,
        isError: false,
        error: null,
        status: 'success',
        isPending: false,
        isSuccess: true,
        isFetched: true,
        isFetching: false,
        isRefetching: false,
        isLoadingError: false,
        isPaused: false,
        failureCount: 0,
        failureReason: null,
        dataUpdatedAt: 0,
        errorUpdatedAt: 0,
        refetch: vi.fn(),
      } as any)

      vi.mocked(useVaultOraclePrice).mockReturnValue(MOCK_VAULT_ORACLE_RESULT)

      renderHook(() =>
        usePrice({
          vaultAddress: MOCK_VAULT_ADDRESS,
        }),
      )

      // Vault config fetch should be enabled
      const callArgs = vi.mocked(useReadContracts).mock.calls[0]?.[0]
      expect(callArgs?.query?.enabled).toBe(true)
    })

    it('should wait for indexer to resolve before fetching vault config', async () => {
      vi.mocked(useIndexerPrices).mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        isSuccess: false,
        error: null,
      })

      vi.mocked(useVaultConfig).mockReturnValue(MOCK_CONFIG)
      vi.mocked(useReadContracts).mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: false,
        error: null,
        status: 'success',
        isPending: false,
        isSuccess: true,
        isFetched: true,
        isFetching: false,
        isRefetching: false,
        isLoadingError: false,
        isPaused: false,
        failureCount: 0,
        failureReason: null,
        dataUpdatedAt: 0,
        errorUpdatedAt: 0,
        refetch: vi.fn(),
      } as any)

      vi.mocked(useVaultOraclePrice).mockReturnValue({
        ...MOCK_VAULT_ORACLE_RESULT,
        priceUSD: 0,
        source: 'none',
      })

      const { result } = renderHook(() =>
        usePrice({
          vaultAddress: MOCK_VAULT_ADDRESS,
        }),
      )

      // Should be loading while indexer is loading
      expect(result.current.isLoading).toBe(true)

      // Vault config fetch should be disabled while indexer is loading
      const callArgs = vi.mocked(useReadContracts).mock.calls[0]?.[0]
      expect(callArgs?.query?.enabled).toBe(false)
    })
  })
})
