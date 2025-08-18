import type { RetailerInfo } from '~/types/retailer/retailer.types'
import type { PageType } from '~/types/view-data/page-type.types'

interface UrlPattern {
  type: string
  value: string[]
}

/**
 * Determines the page type (e.g., product, cart) by matching the `currentUrl` against
 * URL patterns from a pre-identified retailer configuration.
 *
 * @param {string | null | undefined} currentUrl The full URL of the current page.
 * @param {RetailerInfo | null} retailerResult The retailer configuration for the page, or null if unsupported.
 * @param {boolean} isCaDomain A flag indicating if the URL is a known Canadian TLD.
 * @param {string | null} baseName The base domain name (e.g., 'walmart') from tldts.
 * @returns {Promise<PageType>} A promise that resolves to the determined `PageType`.
 * @todo Consider stricter pattern matching (startsWith(), endsWith(), ===) instead of includes().
 */
export async function detectPageType(
  currentUrl: string | null | undefined,
  retailerResult: RetailerInfo | null,
  isCaDomain: boolean,
  baseName: string | null,
): Promise<PageType> {
  // Fetch failed for this retailer
  if (!retailerResult)
    return 'RETAILER_ERROR_PAGE'

  if (isCaDomain === false && baseName !== 'bureauengros')
    return 'UNSUPPORTED_DOMAIN'

  // Ensure we have a valid URL string to parse
  if (!currentUrl || typeof currentUrl !== 'string')
    return 'ERROR_PAGE'

  let path: string
  try {
    path = new URL(currentUrl).pathname
  }
  catch (error) {
    console.error('detectPageType: Invalid URL provided', currentUrl, error)
    return 'ERROR_PAGE'
  }

  // Access the patterns array
  const urlPatterns: UrlPattern[] | undefined = retailerResult?.url_patterns?.url_patterns
  if (!urlPatterns)
    return 'URL_ERROR_PAGE'

  // Helper returns boolean: Does path match any value for this pattern type?
  const checkPatternMatch = (type: string): boolean => {
    const patterns = urlPatterns.filter((pattern: UrlPattern) => pattern.type === type)
    return patterns.some(pattern =>
      pattern.value.some(value => path.includes(value)),
    )
  }

  // --- Check patterns in priority order ---

  // 1. Check ignore rules first
  if (checkPatternMatch('cart-ignore')) {
    return 'CART_IGNORE_PAGE'
  }

  if (checkPatternMatch('product-ignore')) {
    return 'PRODUCT_IGNORE_PAGE'
  }

  // 2. Check main page types
  if (checkPatternMatch('cart')) {
    return 'CART_PAGE'
  }
  if (checkPatternMatch('product')) {
    return 'PRODUCT_PAGE'
  }

  // 3. If we got here, it's a supported retailer on an unsupported page
  return 'UNSUPPORTED_PAGE'
}
