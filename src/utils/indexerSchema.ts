import { z } from 'zod'

/**
 * Ethereum address regex pattern.
 * Validates 0x followed by 40 hex characters (case-insensitive).
 */
const addressPattern = /^0x[a-fA-F0-9]{40}$/

/**
 * Zod schema for Ethereum addresses.
 * Validates format but doesn't checksum - use viem's getAddress for that.
 */
const AddressSchema = z.string().regex(addressPattern, 'Invalid Ethereum address format')

/**
 * Schema for intrinsic APY data (staking yields from kHYPE, wstHYPE, etc.)
 */
const IntrinsicApySchema = z.object({
  apy: z.number(),
  timestamp: z.string().optional(),
  provider: z.string().optional(),
  source: z.string().optional(),
  description: z.string().nullable().optional(),
})

/**
 * Schema for collateral exposure data
 */
const ExposureSchema = z.object({
  vault: AddressSchema,
  collateral: AddressSchema,
  vaultAsset: AddressSchema,
  vaultName: z.string(),
  borrowLTV: z.string(),
  liquidationLTV: z.string(),
  initialLiquidationLTV: z.string(),
  targetTimestamp: z.string(),
  rampDuration: z.string(),
})

/**
 * Schema for product metadata
 */
const ProductSchema = z.object({
  name: z.string(),
  entity: z.array(z.string()),
  description: z.string(),
  isGovernanceLimited: z.boolean(),
})

/**
 * Schema for entity metadata
 */
const EntitySchema = z.object({
  entity: z.string(),
  name: z.string(),
  logo: z.string(),
  description: z.string(),
  url: z.string(),
  addresses: z.record(z.string(), z.string()),
  social: z.record(z.string(), z.string()),
})

/**
 * Schema for reward metadata
 */
const RewardMetadataSchema = z.object({
  reward: AddressSchema,
  rewardSymbol: z.string(),
  rewardDecimals: z.number(),
})

/**
 * Schema for a single vault item from the indexer API.
 * Uses .passthrough() to allow additional unknown fields without failing.
 */
export const IndexerVaultItemSchema = z.object({
  // Required fields
  vault: AddressSchema,
  assetPrice: z.number().nullable(),

  // Optional identity fields
  vaultName: z.string().optional(),
  vaultSymbol: z.string().optional(),
  vaultDecimals: z.number().optional(),
  asset: AddressSchema.optional(),
  assetSymbol: z.string().optional(),
  assetDecimals: z.number().optional(),
  assetPriceTimestamp: z.string().optional(),

  // Optional financial fields
  totalAssets: z.string().optional(),
  totalAssetsUSD: z.number().optional(),
  totalBorrows: z.string().optional(),
  cash: z.string().optional(),
  cashUSD: z.number().optional(),
  totalShares: z.string().optional(),
  utilization: z.number().optional(),

  // Optional APY fields
  baseApy: z.number().nullable().optional(),
  intrinsicApy: IntrinsicApySchema.nullable().optional(),
  rewardApy: z.number().nullable().optional(),
  totalApy: z.number().nullable().optional(),

  // Optional cap fields
  supplyCap: z.string().optional(),
  borrowCap: z.string().optional(),
  supplyCapPercentage: z.number().optional(),

  // Optional metadata fields
  exposure: z.array(ExposureSchema).optional(),
  products: z.array(ProductSchema).optional(),
  entities: z.array(EntitySchema).optional(),
  rewardsMetadata: z.array(RewardMetadataSchema).optional(),
  governorAdmin: AddressSchema.optional(),
  governorType: z.string().optional(),

  // Perspectives for verification
  perspectives: z.array(AddressSchema).optional(),
}).passthrough() // Allow additional fields from API without failing

/**
 * Schema for the full indexer API response
 */
export const IndexerResponseSchema = z.object({
  items: z.array(IndexerVaultItemSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
  }),
})

/**
 * Inferred TypeScript type from the vault item schema
 */
export type ValidatedIndexerVaultItem = z.infer<typeof IndexerVaultItemSchema>

/**
 * Inferred TypeScript type from the response schema
 */
export type ValidatedIndexerResponse = z.infer<typeof IndexerResponseSchema>

/**
 * Validates an indexer response and returns the parsed data.
 * Logs warnings for invalid items but doesn't throw.
 *
 * @param data - Raw response from indexer API
 * @returns Validated response with any invalid items filtered out
 */
export function validateIndexerResponse(data: unknown): ValidatedIndexerResponse | null {
  const result = IndexerResponseSchema.safeParse(data)

  if (!result.success) {
    console.warn(
      '[@hypurr/vaults] Invalid indexer response:',
      result.error.issues.slice(0, 3).map(i => `${i.path.join('.')}: ${i.message}`)
    )
    return null
  }

  return result.data
}
