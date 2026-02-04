'use client'

import { useContext } from 'react'
import type { OracleConfig } from '../config/types'
import { OracleContext } from './OracleProvider'

/**
 * Hook to access the Oracle configuration from the nearest OracleProvider.
 *
 * Returns the OracleConfig object provided to the parent OracleProvider.
 * Throws an error if used outside of an OracleProvider context.
 *
 * @example
 * ```tsx
 * function PriceDisplay() {
 *   const config = useOracleConfig()
 *
 *   console.log('Chain ID:', config.chainId)
 *   console.log('Router:', config.routerAddress)
 *
 *   return <div>Using oracle on chain {config.chainId}</div>
 * }
 * ```
 *
 * @returns The OracleConfig from the nearest OracleProvider (never null)
 * @throws Error if called outside of an OracleProvider
 */
export function useOracleConfig(): OracleConfig {
  const context = useContext(OracleContext)

  if (context === null) {
    throw new Error(
      '[@hypurr/oracle-react] useOracleConfig must be used within an OracleProvider. ' +
        'Wrap your component tree with <OracleProvider config={...}>.',
    )
  }

  return context
}
