'use client'

import { type Address, getAddress } from 'viem'
import { useReadContracts } from 'wagmi'
import { eVaultImplementationAbi } from '../abis'
import type { VaultConfig } from '../config'
import { useVaultConfig } from '../context'
import { useIndexerPrices } from './useIndexerPrices'
import { useVaultOraclePrice } from './useVaultOraclePrice'

export interface UsePriceParams {
  assetAddress?: Address
  vaultAddress?: Address
  oracleAddress?: Address
  unitOfAccount?: Address
  chainId?: number
  enabled?: boolean
  config?: VaultConfig
}

export interface UsePriceResult {
  priceUSD: number
  isLoading: boolean
  isError: boolean
  error: Error | null
  source: 'vaultOracle' | 'indexer' | 'none'
}

export function usePrice({
  assetAddress,
  vaultAddress,
  oracleAddress,
  unitOfAccount,
  chainId,
  enabled = true,
  config: configOverride,
}: UsePriceParams): UsePriceResult {
  const contextConfig = useVaultConfig()
  const config = configOverride ?? contextConfig

  const effectiveChainId = chainId ?? config.chainId

  const indexerPrices = useIndexerPrices()

  let indexerPrice: number | null = null
  if (vaultAddress && indexerPrices.data) {
    try {
      const normalizedVaultAddress = getAddress(vaultAddress) as Address
      indexerPrice = indexerPrices.data[normalizedVaultAddress] ?? null
    } catch {
      indexerPrice = null
    }
  }

  const hasIndexerPrice = indexerPrice !== null && indexerPrice > 0

  const shouldFetchVaultConfig = enabled && !!vaultAddress && (!oracleAddress || !unitOfAccount)

  const {
    data: vaultConfigData,
    isLoading: isVaultConfigLoading,
    isError: isVaultConfigError,
    error: vaultConfigError,
  } = useReadContracts({
    contracts: [
      {
        address: vaultAddress,
        abi: eVaultImplementationAbi,
        functionName: 'oracle',
        chainId: effectiveChainId,
      },
      {
        address: vaultAddress,
        abi: eVaultImplementationAbi,
        functionName: 'unitOfAccount',
        chainId: effectiveChainId,
      },
    ],
    query: {
      enabled: shouldFetchVaultConfig,
      staleTime: 60_000,
    },
  })

  const finalOracleAddress = oracleAddress || (vaultConfigData?.[0]?.result as Address | undefined)
  const finalUnitOfAccount = unitOfAccount || (vaultConfigData?.[1]?.result as Address | undefined)

  const shouldFetchOracle = enabled && !hasIndexerPrice && !!finalOracleAddress && !!finalUnitOfAccount

  const vaultOraclePrice = useVaultOraclePrice({
    assetAddress,
    oracleAddress: finalOracleAddress,
    unitOfAccount: finalUnitOfAccount,
    chainId: effectiveChainId,
    enabled: shouldFetchOracle,
    config,
  })

  if (indexerPrice !== null && indexerPrice > 0) {
    return {
      priceUSD: indexerPrice,
      isLoading: false,
      isError: false,
      error: null,
      source: 'indexer',
    }
  }

  const isLoading = indexerPrices.isLoading || isVaultConfigLoading || vaultOraclePrice.isLoading
  const isError = isVaultConfigError || vaultOraclePrice.isError
  const error = vaultConfigError ?? vaultOraclePrice.error ?? null

  let source: 'vaultOracle' | 'indexer' | 'none'
  if (vaultOraclePrice.source === 'onchain') {
    source = 'vaultOracle'
  } else {
    source = 'none'
  }

  return {
    priceUSD: vaultOraclePrice.priceUSD,
    isLoading,
    isError,
    error,
    source,
  }
}
