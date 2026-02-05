'use client'

import * as React from 'react'
import type { VaultConfig } from '../config/types'

/**
 * Context for providing vault configuration throughout the component tree.
 * @internal
 */
export const VaultContext = React.createContext<VaultConfig | null>(null)

/**
 * Props for the VaultProvider component.
 */
export interface VaultProviderProps {
  /**
   * Vault configuration containing chain, router, and unit of account settings.
   * This is required and cannot be null.
   */
  config: VaultConfig
  /**
   * Child components that will have access to the vault context.
   */
  children: React.ReactNode
}

/**
 * Provider component that supplies vault configuration to all child components.
 *
 * Follows the wagmi WagmiProvider pattern. Must wrap any components that use
 * vault hooks like `usePrice` or `useVaultConfig`.
 *
 * @example
 * ```tsx
 * import { VaultProvider } from '@hypurr/vaults'
 * import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
 * import { WagmiProvider } from 'wagmi'
 *
 * const vaultConfig = {
 *   chainId: 1,
 *   usdUnitOfAccount: '0x0000000000000000000000000000000000000348',
 *   usdReferenceToken: '0xb8ce59fc3717ada4c02eadf9682a9e934f625ebb',
 * }
 *
 * function App() {
 *   return (
 *     <WagmiProvider config={wagmiConfig}>
 *       <QueryClientProvider client={queryClient}>
 *         <VaultProvider config={vaultConfig}>
 *           <YourApp />
 *         </VaultProvider>
 *       </QueryClientProvider>
 *     </WagmiProvider>
 *   )
 * }
 * ```
 *
 * @param props - Provider props containing config and children
 * @returns React element wrapping children with vault context
 */
export function VaultProvider({ config, children }: VaultProviderProps): React.ReactElement {
  if (!config) {
    throw new Error(
      '[@hypurr/vaults] VaultProvider requires a config prop. ' +
        'Please provide a VaultConfig object with chainId, usdUnitOfAccount, and usdReferenceToken.',
    )
  }

  return <VaultContext.Provider value={config}>{children}</VaultContext.Provider>
}

VaultProvider.displayName = 'VaultProvider'
