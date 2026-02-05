import type { Address } from 'viem'

/**
 * Configuration for the vault system.
 *
 * @example
 * ```ts
 * const config: VaultConfig = {
 *   chainId: 999,
 *   routerAddress: '0x28675f23E149c25f4f672FAD05f4e71DAfb75048',
 *   usdUnitOfAccount: '0x0000000000000000000000000000000000000348',
 *   usdReferenceToken: '0xb8ce59fc3717ada4c02eadf9682a9e934f625ebb',
 *   indexerUrl: 'https://indexer-hyperevm-api-prod.up.railway.app',
 * }
 * ```
 */
export interface VaultConfig {
  /**
   * The chain ID where the oracle contracts are deployed.
   * Used to ensure queries target the correct network.
   */
  chainId: number

  /**
   * Address of the Euler Oracle Router contract.
   * This is the main entry point for price queries.
   */
  routerAddress: Address

  /**
   * Unit of account for USD-denominated prices.
   * Typically a virtual address representing USD (e.g., 0x348 for 840 decimal = USD ISO code).
   */
  usdUnitOfAccount: Address

  /**
   * Address of the reference token for USD pricing.
   * Usually a stablecoin like USDC used as the base for USD conversions.
   */
  usdReferenceToken: Address

  /**
   * URL of the indexer API for fetching prices.
   * When provided, prices are fetched from the indexer first, with on-chain oracle as fallback.
   * If not provided, only on-chain oracle is used.
   *
   * @example 'https://indexer-hyperevm-api-prod.up.railway.app'
   */
  indexerUrl?: string

  /**
   * Time in milliseconds before indexer data is considered stale.
   * @default 60000 (1 minute)
   */
  indexerStaleTime?: number

  /**
   * Callback invoked when indexer fetch fails.
   * Useful for logging or monitoring indexer health.
   * The hook will silently fall back to on-chain oracle regardless.
   */
  onIndexerError?: (error: Error) => void

  /**
   * Address of the VaultLens contract for comprehensive vault data queries.
   * Used as fallback when indexer is unavailable, or for on-chain-only fields.
   *
   * @example '0x0eaDDE9EfCf1540dcA8f94e813E12db55f8405a8' (HyperEVM)
   */
  vaultLensAddress?: Address
}
