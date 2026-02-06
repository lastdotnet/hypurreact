/**
 * Price staleness threshold in milliseconds.
 * Prices older than this are treated as stale and trigger on-chain fallback.
 */
export const PRICE_STALENESS_THRESHOLD = 15 * 60 * 1000 // 15 minutes

/**
 * Checks if a price timestamp is stale (older than 15 minutes).
 *
 * A price is considered stale if:
 * 1. Timestamp is undefined/missing
 * 2. Timestamp is invalid (unparseable)
 * 3. Timestamp is older than PRICE_STALENESS_THRESHOLD
 *
 * @param timestamp - ISO 8601 timestamp string from indexer
 * @returns true if price is stale and should trigger on-chain fallback
 */
export function isPriceStale(timestamp: string | undefined): boolean {
  if (!timestamp) return true

  try {
    const priceTime = new Date(timestamp).getTime()
    if (isNaN(priceTime)) return true // Invalid timestamp

    const now = Date.now()
    const age = now - priceTime
    return age > PRICE_STALENESS_THRESHOLD
  } catch {
    return true
  }
}
