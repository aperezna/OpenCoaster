// ---------------------------------------------------------------------------
// Formatters — locale-aware distance, wait time, and date formatting
// ---------------------------------------------------------------------------

import { getCurrentLanguage } from './config';

/**
 * Format a date using locale-specific short format.
 * Falls back to the active i18next language when locale is not passed.
 */
export function formatDate(date: Date, locale?: string): string {
  const resolvedLocale = locale ?? getCurrentLanguage();
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
export function formatDistance(meters: number, locale?: string): string {
  const resolvedLocale = locale ?? getCurrentLanguage();
  const numberFormatter = new Intl.NumberFormat(resolvedLocale, {
    maximumFractionDigits: 1,
    useGrouping: false,
  });

  if (meters < 1000) {
    return `${numberFormatter.format(Math.round(meters))} m`;
  }
  const km = meters / 1000;
  // Show one decimal only when needed (not a round km value)
  return `${numberFormatter.format(km)} km`;
}

/**
 * Format a wait time in minutes.
 * Returns singular "min" for 1 minute, plural "mins" otherwise.
 * Note: the Spanish locale also uses "min" / "mins" per the design spec.
 */
export function formatWait(minutes: number, locale?: string): string {
  const resolvedLocale = locale ?? getCurrentLanguage();
  const unit = resolvedLocale.startsWith('es') || minutes === 1 ? 'min' : 'mins';
  return `${minutes} ${unit}`;
}
