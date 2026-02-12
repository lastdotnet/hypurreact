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
 * Supports:
 * - ISO 8601 timestamps (e.g. "2026-02-11T13:00:00.000Z")
 * - Unix timestamps in seconds (e.g. "1770758861")
 * - Unix timestamps in milliseconds (e.g. "1770758861000")
 *
 * @param timestamp - Timestamp value from indexer
 * @returns true if price is stale and should trigger on-chain fallback
 */
export function isPriceStale(timestamp: string | null | undefined): boolean {
  if (!timestamp) return true

  try {
    const normalized = timestamp.trim()

    let priceTime: number
    if (/^\d+$/.test(normalized)) {
      // Numeric timestamp from some indexer endpoints:
      // - 10 digits: seconds
      // - 13 digits: milliseconds
      const raw = Number(normalized)
      if (!Number.isFinite(raw)) return true
      priceTime = raw < 1e11 ? raw * 1000 : raw
    } else {
      priceTime = new Date(normalized).getTime()
    }
    if (isNaN(priceTime)) return true

    const now = Date.now()
    const age = now - priceTime
    return age > PRICE_STALENESS_THRESHOLD
  } catch {
    return true
  }
}
