const SECONDS_PER_YEAR = 365.25 * 24 * 60 * 60

/**
 * Calculate APY based on share price changes over time.
 *
 * APY = ((currentSharePrice / previousSharePrice) - 1) * (secondsPerYear / timeDeltaSeconds)
 *
 * @param currentTotalAssets - Current total assets in the vault
 * @param currentTotalShares - Current total shares in the vault
 * @param previousTotalAssets - Previous total assets in the vault
 * @param previousTotalShares - Previous total shares in the vault
 * @param timeDeltaSeconds - Time difference in seconds between the two snapshots
 * @returns The annualized APY as a decimal (e.g., 0.05 for 5%)
 */
export function calculateAPY(
  currentTotalAssets: bigint,
  currentTotalShares: bigint,
  previousTotalAssets: bigint,
  previousTotalShares: bigint,
  timeDeltaSeconds: number,
): number {
  if (timeDeltaSeconds <= 0) {
    return 0
  }

  if (currentTotalShares === 0n || previousTotalShares === 0n) {
    return 0
  }

  if (previousTotalAssets === 0n) {
    return 0
  }

  // Calculate share prices with high precision
  // sharePrice = totalAssets / totalShares
  // Using scaled arithmetic to maintain precision
  const SCALE = 10n ** 18n

  const currentSharePrice = (currentTotalAssets * SCALE) / currentTotalShares
  const previousSharePrice = (previousTotalAssets * SCALE) / previousTotalShares

  if (previousSharePrice === 0n) {
    return 0
  }

  // Calculate price ratio: (currentSharePrice / previousSharePrice)
  const priceRatio = Number(currentSharePrice) / Number(previousSharePrice)

  // Calculate APY: (priceRatio - 1) * (secondsPerYear / timeDeltaSeconds)
  const periodReturn = priceRatio - 1
  const apy = periodReturn * (SECONDS_PER_YEAR / timeDeltaSeconds)

  return apy
}

/**
 * Calculate APY from two share price snapshots.
 *
 * @param currentSharePrice - Current share price (as a decimal)
 * @param previousSharePrice - Previous share price (as a decimal)
 * @param timeDeltaSeconds - Time difference in seconds
 * @returns The annualized APY as a decimal
 */
export function calculateAPYFromSharePrices(
  currentSharePrice: number,
  previousSharePrice: number,
  timeDeltaSeconds: number,
): number {
  if (timeDeltaSeconds <= 0 || previousSharePrice <= 0) {
    return 0
  }

  const priceRatio = currentSharePrice / previousSharePrice
  const periodReturn = priceRatio - 1
  const apy = periodReturn * (SECONDS_PER_YEAR / timeDeltaSeconds)

  return apy
}

/**
 * Format APY as a percentage string.
 *
 * @param apy - APY as a decimal (e.g., 0.05 for 5%)
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted percentage string (e.g., "5.00%")
 */
export function formatAPY(apy: number | null, decimals: number = 2): string {
  if (apy === null) {
    return '--'
  }
  return `${(apy * 100).toFixed(decimals)}%`
}
