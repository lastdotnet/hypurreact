'use client'

import { useContext } from 'react'
import type { VaultConfig } from '../config/types'
import { VaultContext } from './VaultProvider'

/**
 * Hook to access the vault configuration from the nearest VaultProvider.
 *
 * Returns the VaultConfig object provided to the parent VaultProvider.
 * Throws an error if used outside of a VaultProvider context.
 *
 * @example
 * ```tsx
 * function PriceDisplay() {
 *   const config = useVaultConfig()
 *
 *   console.log('Chain ID:', config.chainId)
 *   console.log('Router:', config.routerAddress)
 *
 *   return <div>Using vault on chain {config.chainId}</div>
 * }
 * ```
 *
 * @returns The VaultConfig from the nearest VaultProvider (never null)
 * @throws Error if called outside of a VaultProvider
 */
export function useVaultConfig(): VaultConfig {
  const context = useContext(VaultContext)

  if (context === null) {
    throw new Error(
      '[@hypurr/vaults] useVaultConfig must be used within a VaultProvider. ' +
        'Wrap your component tree with <VaultProvider config={...}>.',
    )
  }

  return context
}
