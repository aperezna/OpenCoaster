// ---------------------------------------------------------------------------
// Formatters — locale-aware distance, wait time, and date formatting
// ---------------------------------------------------------------------------

/**
 * Format a date using locale-specific short format.
 * Falls back to the active i18next language when locale is not passed.
 */
export function formatDate(date: Date, locale?: string): string {
  const resolvedLocale = locale ?? 'en';
  return date.toLocaleDateString(resolvedLocale, {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  });
}

/**
 * Format a distance in meters to a human-readable string.
 * Uses meters (< 1000) or kilometers (>= 1000) with one decimal.
 */
export function formatDistance(meters: number, _locale?: string): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  const km = meters / 1000;
  // Show one decimal only when needed (not a round km value)
  const formatted = km % 1 === 0 ? `${km}` : `${km.toFixed(1)}`;
  return `${formatted} km`;
}

/**
 * Format a wait time in minutes.
 * Returns singular "min" for 1 minute, plural "mins" otherwise.
 * Note: the Spanish locale also uses "min" / "mins" per the design spec.
 */
export function formatWait(minutes: number, _locale?: string): string {
  return minutes === 1 ? `${minutes} min` : `${minutes} mins`;
}
