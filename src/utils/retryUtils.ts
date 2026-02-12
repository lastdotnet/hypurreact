import type { RetryConfig } from '../config/types'

/**
 * Default exponential backoff delay function.
 * Doubles delay with each attempt, capped at 30 seconds.
 */
export function defaultRetryDelay(attempt: number): number {
  return Math.min(1000 * 2 ** attempt, 30_000)
}

/**
 * Default function to determine if an error should be retried.
 * Retries all errors except 4xx client errors (which indicate bad requests).
 */
export function defaultShouldRetry(error: Error, _attempt?: number): boolean {
  // Don't retry client errors (4xx) — match "4XX" status codes as whole words
  const message = error.message
  if (/\b400\b/.test(message) || /bad request/i.test(message)) return false
  if (/\b401\b/.test(message) || /unauthorized/i.test(message)) return false
  if (/\b403\b/.test(message) || /forbidden/i.test(message)) return false
  if (/\b404\b/.test(message) || /not found/i.test(message)) return false
  if (/\b422\b/.test(message) || /unprocessable/i.test(message)) return false
  if (/\b429\b/.test(message) || /too many requests/i.test(message)) return true // Retry rate limits

  // Retry all other errors (5xx, network errors, etc.)
  return true
}

/**
 * Converts RetryConfig to TanStack Query retry options.
 *
 * @param config - The retry configuration from VaultConfig
 * @returns Options compatible with TanStack Query's retry settings
 *
 * @example
 * ```ts
 * const { retry, retryDelay } = getRetryOptions(config.retry)
 *
 * useQuery({
 *   queryKey: ['vault', address],
 *   queryFn: fetchVault,
 *   retry,
 *   retryDelay,
 * })
 * ```
 */
export function getRetryOptions(config?: RetryConfig): {
  retry: number | false | ((failureCount: number, error: Error) => boolean)
  retryDelay: number | ((attempt: number, error: Error) => number)
} {
  // Default: 3 retries with exponential backoff
  if (!config) {
    return {
      retry: (failureCount, error) => {
        if (failureCount >= 3) return false
        return defaultShouldRetry(error)
      },
      retryDelay: defaultRetryDelay,
    }
  }

  // Disabled
  if (config.count === false || config.count === 0) {
    return {
      retry: false,
      retryDelay: 0,
    }
  }

  const maxRetries = config.count ?? 3
  const shouldRetry = config.shouldRetry ?? defaultShouldRetry

  return {
    retry: (failureCount, error) => {
      if (failureCount >= maxRetries) return false
      return shouldRetry(error, failureCount)
    },
    retryDelay: config.delay ?? defaultRetryDelay,
  }
}

/**
 * Creates a retry configuration preset.
 *
 * @example No retries
 * ```ts
 * const config = createVaultConfig({
 *   ...baseConfig,
 *   retry: retryPresets.none,
 * })
 * ```
 *
 * @example Aggressive retries for unreliable networks
 * ```ts
 * const config = createVaultConfig({
 *   ...baseConfig,
 *   retry: retryPresets.aggressive,
 * })
 * ```
 */
export const retryPresets = {
  /**
   * No retries - fail immediately on first error.
   * Good for development or when errors should surface quickly.
   */
  none: {
    count: 0,
  } as RetryConfig,

  /**
   * Conservative retry strategy (default).
   * 3 retries with exponential backoff, skips 4xx errors.
   */
  default: {
    count: 3,
    delay: defaultRetryDelay,
    shouldRetry: defaultShouldRetry,
  } as RetryConfig,

  /**
   * Aggressive retry strategy for unreliable networks.
   * 5 retries with longer delays, retries everything except 404s.
   */
  aggressive: {
    count: 5,
    delay: (attempt: number) => Math.min(2000 * 2 ** attempt, 60_000),
    shouldRetry: (error: Error, _attempt?: number) => {
      // Only skip 404s - retry everything else including other 4xx
      return !/\b404\b/.test(error.message) && !/not found/i.test(error.message)
    },
  } as RetryConfig,

  /**
   * Instant retry without delay.
   * Good for idempotent operations that might fail due to race conditions.
   */
  instant: {
    count: 3,
    delay: 0,
    shouldRetry: defaultShouldRetry,
  } as RetryConfig,
} as const
