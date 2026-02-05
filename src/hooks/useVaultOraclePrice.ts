'use client'

import { Address, formatUnits } from 'viem'
import { useReadContract } from 'wagmi'
import { erc20Abi, eulerOraclePriceAbi } from '../abis'
import type { VaultConfig } from '../config'
import { useVaultConfig } from '../context'

export interface UseVaultOraclePriceParams {
  assetAddress?: Address
  oracleAddress?: Address
  unitOfAccount?: Address
  chainId?: number
  enabled?: boolean
  config?: VaultConfig
}

export interface UseVaultOraclePriceResult {
  priceUSD: number
  isLoading: boolean
  isError: boolean
  error: Error | null
  priceInUoA?: bigint
  uoaToUSD?: bigint
  source: 'onchain' | 'none'
}

export function useVaultOraclePrice({
  assetAddress,
  oracleAddress,
  unitOfAccount,
  chainId,
  enabled = true,
  config: configOverride,
}: UseVaultOraclePriceParams): UseVaultOraclePriceResult {
  const contextConfig = useVaultConfig()
  const config = configOverride ?? contextConfig

  const effectiveChainId = chainId ?? config.chainId
  const isUSDUnitOfAccount = unitOfAccount === config.usdUnitOfAccount

  const {
    data: assetDecimals,
    isLoading: isDecimalsLoading,
    isError: isDecimalsError,
    error: decimalsError,
  } = useReadContract({
    address: assetAddress,
    abi: erc20Abi,
    functionName: 'decimals',
    chainId: effectiveChainId,
    query: {
      enabled: enabled && !!assetAddress,
    },
  })

  const {
    data: uoaDecimals,
    isLoading: isUoaDecimalsLoading,
    isError: isUoaDecimalsError,
    error: uoaDecimalsError,
  } = useReadContract({
    address: isUSDUnitOfAccount ? undefined : unitOfAccount,
    abi: erc20Abi,
    functionName: 'decimals',
    chainId: effectiveChainId,
    query: {
      enabled: enabled && !!unitOfAccount && !isUSDUnitOfAccount,
    },
  })

  const actualUoaDecimals = isUSDUnitOfAccount ? 18 : uoaDecimals

  const {
    data: priceInUoA,
    isLoading: isPriceInUoALoading,
    isError: isPriceInUoAError,
    error: priceInUoAError,
  } = useReadContract({
    address: oracleAddress,
    abi: eulerOraclePriceAbi,
    functionName: 'getQuote',
    args:
      assetDecimals !== undefined
        ? [BigInt(10 ** assetDecimals), assetAddress as Address, unitOfAccount as Address]
        : undefined,
    chainId: effectiveChainId,
    query: {
      enabled:
        enabled &&
        !!oracleAddress &&
        !!assetAddress &&
        !!unitOfAccount &&
        assetDecimals !== undefined &&
        actualUoaDecimals !== undefined,
    },
  })

  const {
    data: uoaInUSD,
    isLoading: isUoaInUSDLoading,
    isError: isUoaInUSDError,
    error: uoaInUSDError,
  } = useReadContract({
    address: oracleAddress,
    abi: eulerOraclePriceAbi,
    functionName: 'getQuote',
    args:
      actualUoaDecimals !== undefined
        ? [BigInt(10 ** actualUoaDecimals), unitOfAccount as Address, config.usdReferenceToken]
        : undefined,
    chainId: effectiveChainId,
    query: {
      enabled:
        enabled &&
        !!oracleAddress &&
        !!unitOfAccount &&
        !isUSDUnitOfAccount &&
        actualUoaDecimals !== undefined,
    },
  })

  const isLoading = isDecimalsLoading || isUoaDecimalsLoading || isPriceInUoALoading || isUoaInUSDLoading
  const isError = isDecimalsError || isUoaDecimalsError || isPriceInUoAError || isUoaInUSDError
  const error = decimalsError ?? uoaDecimalsError ?? priceInUoAError ?? uoaInUSDError ?? null

  let onchainPrice = 0
  if (priceInUoA && uoaInUSD) {
    const assetInUoa = Number(formatUnits(priceInUoA, actualUoaDecimals || 18))
    const uoaToUsd = Number(formatUnits(uoaInUSD, 6))
    onchainPrice = assetInUoa * uoaToUsd
  } else if (priceInUoA && isUSDUnitOfAccount) {
    onchainPrice = Number(formatUnits(priceInUoA, actualUoaDecimals || 18))
  }

  return {
    priceUSD: onchainPrice,
    isLoading,
    isError,
    error,
    priceInUoA,
    uoaToUSD: uoaInUSD,
    source: onchainPrice > 0 ? 'onchain' : 'none',
  }
}
