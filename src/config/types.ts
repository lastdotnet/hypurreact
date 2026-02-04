import type { Address } from 'viem'

/**
 * Configuration for the Oracle system.
 *
 * @example
 * ```ts
 * const config: OracleConfig = {
 *   chainId: 1,
 *   routerAddress: '0x28675f23E149c25f4f672FAD05f4e71DAfb75048',
 *   usdUnitOfAccount: '0x0000000000000000000000000000000000000348',
 *   usdReferenceToken: '0xb8ce59fc3717ada4c02eadf9682a9e934f625ebb',
 * }
 * ```
 */
export interface OracleConfig {
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
}
