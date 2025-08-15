import { get } from 'country-flag-emoji'

/**
 * Retrieves the emoji flag for a given 2-letter country code.
 * @param countryCode - The 2-letter ISO country code (e.g., 'CA', 'US').
 * @returns The flag emoji string, or null if not found or invalid code.
 */
export function getFlagEmoji(countryCode: string | null | undefined): string | null {
  if (!countryCode || countryCode.length !== 2) {
    return null
  }
  // Ensure countryCode is uppercase as some libraries might be case-sensitive
  const flagData = get(countryCode.toUpperCase())
  return flagData ? flagData.emoji : null
}
