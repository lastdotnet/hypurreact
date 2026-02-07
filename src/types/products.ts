import type { Address } from 'viem'
import { getAddress } from 'viem'

export type ProductId = 'hypurrfi-earn' | 'hypurrfi-prime' | 'hypurrfi-yield'

export interface ProductConfig {
  name: string
  description: string
  entity: string[]
  url: string
  vaults: Address[]
}

export type ProductsConfig = Record<ProductId, ProductConfig>

/**
 * Get all vault addresses for a specific product.
 */
export function getProductVaults(products: ProductsConfig, productId: ProductId): Address[] {
  const product = products[productId]
  if (!product) {
    return []
  }
  return product.vaults
}

/**
 * Check if a vault belongs to a specific product.
 */
export function isVaultInProduct(
  products: ProductsConfig,
  vaultAddress: Address,
  productId: ProductId,
): boolean {
  const vaults = getProductVaults(products, productId)
  try {
    const normalizedAddress = getAddress(vaultAddress) as Address
    return vaults.some(v => {
      try {
        return getAddress(v) === normalizedAddress
      } catch {
        return false
      }
    })
  } catch {
    return false
  }
}

/**
 * Get the product ID for a given vault address, if any.
 */
export function getProductForVault(
  products: ProductsConfig,
  vaultAddress: Address,
): ProductId | null {
  const productIds: ProductId[] = ['hypurrfi-earn', 'hypurrfi-prime', 'hypurrfi-yield']
  for (const productId of productIds) {
    if (isVaultInProduct(products, vaultAddress, productId)) {
      return productId
    }
  }
  return null
}

/**
 * Filter vault addresses to only include those in a specific product.
 */
export function filterVaultsByProduct(
  products: ProductsConfig,
  vaultAddresses: Address[],
  productId: ProductId,
): Address[] {
  return vaultAddresses.filter(v => isVaultInProduct(products, v, productId))
}
