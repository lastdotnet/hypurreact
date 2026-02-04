'use client'

import * as React from 'react'
import type { OracleConfig } from '../config/types'

/**
 * Context for providing Oracle configuration throughout the component tree.
 * @internal
 */
export const OracleContext = React.createContext<OracleConfig | null>(null)

/**
 * Props for the OracleProvider component.
 */
export interface OracleProviderProps {
  /**
   * Oracle configuration containing chain, router, and unit of account settings.
   * This is required and cannot be null.
   */
  config: OracleConfig
  /**
   * Child components that will have access to the Oracle context.
   */
  children: React.ReactNode
}

/**
 * Provider component that supplies Oracle configuration to all child components.
 *
 * Follows the wagmi WagmiProvider pattern. Must wrap any components that use
 * Oracle hooks like `usePrice` or `useOracleConfig`.
 *
 * @example
 * ```tsx
 * import { OracleProvider } from '@hypurr/oracle-react'
 * import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
 * import { WagmiProvider } from 'wagmi'
 *
 * const oracleConfig = {
 *   chainId: 1,
 *   routerAddress: '0x28675f23E149c25f4f672FAD05f4e71DAfb75048',
 *   usdUnitOfAccount: '0x0000000000000000000000000000000000000348',
 *   usdReferenceToken: '0xb8ce59fc3717ada4c02eadf9682a9e934f625ebb',
 * }
 *
 * function App() {
 *   return (
 *     <WagmiProvider config={wagmiConfig}>
 *       <QueryClientProvider client={queryClient}>
 *         <OracleProvider config={oracleConfig}>
 *           <YourApp />
 *         </OracleProvider>
 *       </QueryClientProvider>
 *     </WagmiProvider>
 *   )
 * }
 * ```
 *
 * @param props - Provider props containing config and children
 * @returns React element wrapping children with Oracle context
 */
export function OracleProvider({ config, children }: OracleProviderProps): React.ReactElement {
  if (!config) {
    throw new Error(
      '[@hypurr/oracle-react] OracleProvider requires a config prop. ' +
        'Please provide an OracleConfig object with chainId, routerAddress, usdUnitOfAccount, and usdReferenceToken.',
    )
  }

  return <OracleContext.Provider value={config}>{children}</OracleContext.Provider>
}

OracleProvider.displayName = 'OracleProvider'
