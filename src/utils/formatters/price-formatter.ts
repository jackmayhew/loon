/**
 * Formats a numeric or string value into a locale-specific decimal string representation.
 * This function is intended to format the numeric part of a price, allowing
 * currency symbols or other price formatting to be handled by i18n $t functions.
 *
 * @param value The price value to format. Can be a number, a string representing a number, or undefined/null.
 * @param locale A BCP 47 language tag string (e.g., 'en-US', 'fr-CA') to specify the formatting locale.
 * @param fallbackValue The string to return if the value is null, undefined, or NaN. Defaults to an empty string.
 * @returns A string representing the formatted number, or the fallbackValue.
 */
export function formatPriceNumber(
  value: number | string | undefined | null,
  locale: string,
  fallbackValue: string = '',
): string {
  // Attempt to parse the value to a number if it's a string
  const numericValue = typeof value === 'string' ? Number.parseFloat(value) : value

  // Check if the value is null, undefined, or NaN after parsing
  if (numericValue === null || numericValue === undefined || Number.isNaN(numericValue)) {
    return fallbackValue
  }

  try {
    // Use Intl.NumberFormat for locale-specific number formatting
    return new Intl.NumberFormat(locale, {
      style: 'decimal', // Formats as a plain number
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numericValue)
  }
  catch (error) {
    // Log an error if formatting fails
    console.error(`Error formatting price value "${value}" for locale "${locale}":`, error)
    // Fallback to a simple string conversion of the original (or parsed) number
    return String(numericValue)
  }
}
