import type { Address } from 'viem'

/**
 * Configuration for the vault system.
 *
 * @example
 * ```ts
 * const config: VaultConfig = {
 *   chainId: 999,
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

  /**
   * Address of the GovernedPerspective contract for fetching verified vault lists.
   * When provided, enables the `verified` filter option in useVaults hook.
   *
   * @example '0x4936Cd82936b6862fDD66CC8c36e1828127a6b57' (HyperEVM)
   */
  governedPerspectiveAddress?: Address

  /**
   * Address of the EulerEarnGovernedPerspective contract for fetching verified earn vault lists.
   * When provided, enables the `verified` filter option in useEarnVaults hook.
   *
   * @example '0x7b27dED9344D9c66FeAF58D151b52d1359aeA807' (HyperEVM)
   */
  eulerEarnGovernedPerspectiveAddress?: Address
}
