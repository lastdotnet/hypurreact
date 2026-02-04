import { Address } from 'viem'

/**
 * Query key factory for Oracle-related queries.
 *
 * Follows TanStack Query's query key factory pattern for type-safe cache management.
 * Query keys are structured as arrays with constants and parameters, enabling:
 * - Precise cache invalidation
 * - Efficient prefetching
 * - Automatic dependency tracking
 *
 * @example
 * // Get all oracle keys
 * const baseKey = oracleKeys.all()
 * // ['oracle']
 *
 * @example
 * // Get price query key
 * const priceKey = oracleKeys.price({ chainId: 1, assetAddress: '0x...' })
 * // ['oracle', 'price', { chainId: 1, assetAddress: '0x...' }]
 *
 * @example
 * // Get vault oracle query key
 * const vaultKey = oracleKeys.vaultOracle({ chainId: 1, vaultAddress: '0x...' })
 * // ['oracle', 'vaultOracle', { chainId: 1, vaultAddress: '0x...' }]
 */
export const oracleKeys = {
  /**
   * Base key for all oracle queries.
   * Used as the root for all oracle-related cache entries.
   */
  all: () => ['oracle'] as const,

  /**
   * Query key factory for price queries.
   * Includes chainId and optional asset/oracle addresses.
   *
   * @param params - Query parameters
   * @param params.chainId - The blockchain chain ID
   * @param params.assetAddress - Optional asset token address
   * @param params.oracleAddress - Optional oracle contract address
   * @returns Stable query key for price queries
   */
  price: (params: {
    chainId: number
    assetAddress?: Address
    oracleAddress?: Address
  }) => [...oracleKeys.all(), 'price', params] as const,

  /**
   * Query key factory for vault oracle queries.
   * Includes chainId and optional vault/oracle addresses.
   *
   * @param params - Query parameters
   * @param params.chainId - The blockchain chain ID
   * @param params.vaultAddress - Optional vault contract address
   * @param params.oracleAddress - Optional oracle contract address
   * @returns Stable query key for vault oracle queries
   */
  vaultOracle: (params: {
    chainId: number
    vaultAddress?: Address
    oracleAddress?: Address
  }) => [...oracleKeys.all(), 'vaultOracle', params] as const,
}
