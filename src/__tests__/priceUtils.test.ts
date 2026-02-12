import { describe, expect, it } from 'vitest'
import { isPriceStale, PRICE_STALENESS_THRESHOLD } from '../utils/priceUtils'

describe('isPriceStale', () => {
  it('returns true for missing or invalid timestamps', () => {
    expect(isPriceStale(undefined)).toBe(true)
    expect(isPriceStale(null)).toBe(true)
    expect(isPriceStale('')).toBe(true)
    expect(isPriceStale('not-a-date')).toBe(true)
  })

  it('handles ISO timestamps', () => {
    const freshIso = new Date(Date.now() - 60_000).toISOString()
    const staleIso = new Date(Date.now() - PRICE_STALENESS_THRESHOLD - 60_000).toISOString()

    expect(isPriceStale(freshIso)).toBe(false)
    expect(isPriceStale(staleIso)).toBe(true)
  })

  it('handles unix timestamps in seconds', () => {
    const freshSeconds = Math.floor((Date.now() - 60_000) / 1000).toString()
    const staleSeconds = Math.floor((Date.now() - PRICE_STALENESS_THRESHOLD - 60_000) / 1000).toString()

    expect(isPriceStale(freshSeconds)).toBe(false)
    expect(isPriceStale(staleSeconds)).toBe(true)
  })

  it('handles unix timestamps in milliseconds', () => {
    const freshMs = (Date.now() - 60_000).toString()
    const staleMs = (Date.now() - PRICE_STALENESS_THRESHOLD - 60_000).toString()

    expect(isPriceStale(freshMs)).toBe(false)
    expect(isPriceStale(staleMs)).toBe(true)
  })
})
