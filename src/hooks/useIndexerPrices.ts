'use client'

import { useQuery } from '@tanstack/react-query'
import { type Address, getAddress } from 'viem'
import type { VaultConfig } from '../config'
import { useVaultConfig } from '../context'
import { vaultKeys } from '../utils/queryKeys'
import { isPriceStale } from '../utils/priceUtils'

export interface IndexerVaultItem {
  vault: string
  asset?: string
  assetPrice: number | null
  assetPriceTimestamp?: string
  assetSymbol?: string
  oracle?: string
  unitOfAccount?: string
}

export interface IndexerResponse {
  items: IndexerVaultItem[]
  pagination: {
    page: number
    limit: number
    total: number
  }
}

export type IndexerPriceMap = Record<Address, number | null>

export interface UseIndexerPricesResult {
  data: IndexerPriceMap | undefined
  isLoading: boolean
  isError: boolean
  isSuccess: boolean
  error: Error | null
}

const DEFAULT_STALE_TIME = 60_000

async function fetchIndexerPrices(
  indexerUrl: string,
  chainId: number,
  onIndexerError?: (error: Error) => void,
): Promise<IndexerPriceMap> {
  const url = `${indexerUrl}/v2/vault/list?chainId=${chainId}`

  const body = {
    chainId,
    limit: '100',
    page: '1',
    orderBy: 'totalSupply',
    orderDirection: 'desc',
    onlyInWallet: false,
    settings: {
      disableIntrinsicApy: false,
      disableRewardsApy: false,
    },
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const error = new Error(`Indexer request failed: ${response.status} ${response.statusText}`)
      onIndexerError?.(error)
      throw error
    }

    const data: IndexerResponse = await response.json()

    const priceMap: IndexerPriceMap = {}
    for (const item of data.items) {
      try {
        const normalizedAddress = getAddress(item.vault) as Address
        // Treat stale prices (>15 minutes old) as null to trigger on-chain fallback
        const isStale = isPriceStale(item.assetPriceTimestamp)
        priceMap[normalizedAddress] = isStale ? null : item.assetPrice
      } catch {
        continue
      }
    }

    return priceMap
  } catch (error) {
    onIndexerError?.(error instanceof Error ? error : new Error(String(error)))
    throw error
  }
}

export function useIndexerPrices(configOverride?: Partial<VaultConfig>): UseIndexerPricesResult {
  const contextConfig = useVaultConfig()
  const config = { ...contextConfig, ...configOverride }

  const { chainId, indexerUrl, indexerStaleTime, onIndexerError } = config
  const hasIndexerUrl = !!indexerUrl

  const query = useQuery({
    queryKey: vaultKeys.indexerPrices({ chainId }),
    queryFn: () => {
      if (!indexerUrl) {
        return {} as IndexerPriceMap
      }
      return fetchIndexerPrices(indexerUrl, chainId, onIndexerError)
    },
    enabled: hasIndexerUrl,
    staleTime: indexerStaleTime ?? DEFAULT_STALE_TIME,
    gcTime: 5 * 60 * 1000,
  })

  if (!hasIndexerUrl) {
    return {
      data: {},
      isLoading: false,
      isError: false,
      isSuccess: true,
      error: null,
    }
  }

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    isSuccess: query.isSuccess,
    error: query.error,
  }
}
