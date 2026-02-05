import { queryOptions } from '@tanstack/react-query'

import { vaultKeys } from '../utils/queryKeys'
import type { UsePriceParams, UsePriceResult } from './usePrice'

export function usePriceQueryOptions(params: UsePriceParams) {
  const { assetAddress, oracleAddress, chainId = 1, enabled = true } = params

  return queryOptions<UsePriceResult>({
    queryKey: vaultKeys.price({
      chainId,
      assetAddress,
      oracleAddress,
    }),

    queryFn: async (): Promise<UsePriceResult> => {
      return {
        priceUSD: 0,
        isLoading: false,
        isError: false,
        error: null,
        source: 'none',
      }
    },

    enabled,
    staleTime: 60_000,
  })
}
