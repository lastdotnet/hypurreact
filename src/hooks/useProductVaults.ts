'use client'

import { useMemo } from 'react'
import type { Address } from 'viem'
import type { ProductId, ProductsConfig } from '../types/products'
import { getProductVaults, getProductForVault } from '../types/products'

export interface UseProductVaultsParams {
  products: ProductsConfig
  productId: ProductId
}

export interface UseProductVaultsResult {
  vaults: Address[]
  count: number
}

/**
 * Hook to get all vault addresses for a specific product.
 *
 * @example
 * ```tsx
 * import products from '../lib/euler-labels/999/products.json'
 *
 * function EarnVaultsList() {
 *   const { vaults } = useProductVaults({
 *     products: products as ProductsConfig,
 *     productId: 'hypurrfi-earn',
 *   })
 *
 *   return (
 *     <ul>
 *       {vaults.map(vault => (
 *         <li key={vault}>{vault}</li>
 *       ))}
 *     </ul>
 *   )
 * }
 * ```
 */
export function useProductVaults({ products, productId }: UseProductVaultsParams): UseProductVaultsResult {
  const vaults = useMemo(() => getProductVaults(products, productId), [products, productId])

  return {
    vaults,
    count: vaults.length,
  }
}

export interface UseVaultProductParams {
  products: ProductsConfig
  vaultAddress: Address
}

export interface UseVaultProductResult {
  productId: ProductId | null
  isEarn: boolean
  isPrime: boolean
  isYield: boolean
}

/**
 * Hook to determine which product a vault belongs to.
 *
 * @example
 * ```tsx
 * function VaultBadge({ vaultAddress }: { vaultAddress: Address }) {
 *   const { productId, isEarn } = useVaultProduct({
 *     products,
 *     vaultAddress,
 *   })
 *
 *   if (isEarn) return <Badge>Earn</Badge>
 *   if (productId) return <Badge>{productId}</Badge>
 *   return null
 * }
 * ```
 */
export function useVaultProduct({ products, vaultAddress }: UseVaultProductParams): UseVaultProductResult {
  const productId = useMemo(() => getProductForVault(products, vaultAddress), [products, vaultAddress])

  return {
    productId,
    isEarn: productId === 'hypurrfi-earn',
    isPrime: productId === 'hypurrfi-prime',
    isYield: productId === 'hypurrfi-yield',
  }
}
