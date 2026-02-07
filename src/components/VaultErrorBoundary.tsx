'use client'

import * as React from 'react'

export interface VaultErrorBoundaryProps {
  /**
   * Child components to render
   */
  children: React.ReactNode
  /**
   * Custom fallback UI to show when an error occurs.
   * If not provided, a default error message is displayed.
   */
  fallback?: React.ReactNode
  /**
   * Render function for custom error UI with access to error details.
   * Takes precedence over `fallback` if both are provided.
   */
  fallbackRender?: (props: FallbackRenderProps) => React.ReactNode
  /**
   * Callback fired when an error is caught.
   * Use for error logging/reporting.
   */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  /**
   * Optional key to reset the error boundary.
   * When this value changes, the boundary resets and re-renders children.
   */
  resetKey?: string | number
}

export interface FallbackRenderProps {
  /**
   * The error that was caught
   */
  error: Error
  /**
   * Function to reset the error boundary and retry rendering
   */
  resetErrorBoundary: () => void
}

interface State {
  hasError: boolean
  error: Error | null
}

/**
 * Error boundary component for vault data fetching errors.
 *
 * Catches errors from child components (including Suspense-enabled hooks)
 * and displays a fallback UI. Supports error logging, custom fallbacks,
 * and reset functionality.
 *
 * @example Basic usage
 * ```tsx
 * import { VaultErrorBoundary } from '@hypurr/vaults'
 *
 * function App() {
 *   return (
 *     <VaultErrorBoundary fallback={<div>Something went wrong</div>}>
 *       <VaultDashboard />
 *     </VaultErrorBoundary>
 *   )
 * }
 * ```
 *
 * @example With custom fallback render
 * ```tsx
 * import { VaultErrorBoundary } from '@hypurr/vaults'
 *
 * function App() {
 *   return (
 *     <VaultErrorBoundary
 *       fallbackRender={({ error, resetErrorBoundary }) => (
 *         <div role="alert">
 *           <p>Failed to load vault data:</p>
 *           <pre>{error.message}</pre>
 *           <button onClick={resetErrorBoundary}>Try again</button>
 *         </div>
 *       )}
 *     >
 *       <VaultDashboard />
 *     </VaultErrorBoundary>
 *   )
 * }
 * ```
 *
 * @example With error logging
 * ```tsx
 * import { VaultErrorBoundary } from '@hypurr/vaults'
 *
 * function App() {
 *   return (
 *     <VaultErrorBoundary
 *       onError={(error, errorInfo) => {
 *         // Log to error tracking service
 *         Sentry.captureException(error, { extra: errorInfo })
 *       }}
 *       fallback={<ErrorPage />}
 *     >
 *       <VaultDashboard />
 *     </VaultErrorBoundary>
 *   )
 * }
 * ```
 *
 * @example With reset key (resets when vault address changes)
 * ```tsx
 * function VaultPage({ vaultAddress }: { vaultAddress: Address }) {
 *   return (
 *     <VaultErrorBoundary
 *       resetKey={vaultAddress}
 *       fallback={<div>Failed to load vault</div>}
 *     >
 *       <VaultDetails address={vaultAddress} />
 *     </VaultErrorBoundary>
 *   )
 * }
 * ```
 */
export class VaultErrorBoundary extends React.Component<VaultErrorBoundaryProps, State> {
  constructor(props: VaultErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    this.props.onError?.(error, errorInfo)
  }

  componentDidUpdate(prevProps: VaultErrorBoundaryProps): void {
    // Reset error state when resetKey changes
    if (
      this.state.hasError &&
      prevProps.resetKey !== this.props.resetKey
    ) {
      this.setState({ hasError: false, error: null })
    }
  }

  resetErrorBoundary = (): void => {
    this.setState({ hasError: false, error: null })
  }

  render(): React.ReactNode {
    const { hasError, error } = this.state
    const { children, fallback, fallbackRender } = this.props

    if (hasError && error) {
      // Custom render function takes precedence
      if (fallbackRender) {
        return fallbackRender({
          error,
          resetErrorBoundary: this.resetErrorBoundary,
        })
      }

      // Static fallback
      if (fallback) {
        return fallback
      }

      // Default fallback
      return (
        <div role="alert" style={{ padding: '16px', color: '#dc2626' }}>
          <h3 style={{ margin: '0 0 8px 0' }}>Failed to load vault data</h3>
          <p style={{ margin: '0 0 8px 0', fontSize: '14px' }}>{error.message}</p>
          <button
            onClick={this.resetErrorBoundary}
            style={{
              padding: '8px 16px',
              backgroundColor: '#f3f4f6',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </div>
      )
    }

    return children
  }
}

/**
 * Hook to programmatically trigger error boundary reset.
 * Must be used within a component that has VaultErrorBoundary as an ancestor.
 *
 * @example
 * ```tsx
 * function RetryButton() {
 *   const reset = useResetVaultErrorBoundary()
 *   return <button onClick={reset}>Retry</button>
 * }
 * ```
 */
const ResetContext = React.createContext<(() => void) | null>(null)

export function useResetVaultErrorBoundary(): () => void {
  const reset = React.useContext(ResetContext)
  if (!reset) {
    throw new Error(
      'useResetVaultErrorBoundary must be used within a VaultErrorBoundary'
    )
  }
  return reset
}

/**
 * Provider version of VaultErrorBoundary that exposes reset via context.
 *
 * @example
 * ```tsx
 * function App() {
 *   return (
 *     <VaultErrorBoundaryProvider fallback={<ErrorUI />}>
 *       <VaultDashboard />
 *       <RetryButton /> {/* Can call useResetVaultErrorBoundary() *\/}
 *     </VaultErrorBoundaryProvider>
 *   )
 * }
 * ```
 */
export function VaultErrorBoundaryProvider({
  children,
  ...props
}: VaultErrorBoundaryProps): React.ReactElement {
  const [resetKey, setResetKey] = React.useState(0)

  const reset = React.useCallback(() => {
    setResetKey(k => k + 1)
  }, [])

  return (
    <ResetContext.Provider value={reset}>
      <VaultErrorBoundary {...props} resetKey={resetKey}>
        {children}
      </VaultErrorBoundary>
    </ResetContext.Provider>
  )
}
