import { getRetailerConfig } from '~/logic/config/get-retailer-config'
import { stripHtml } from '~/utils/formatters/strip-html'
import type { RetailerPageConfig, RetailerPageDomSelectors } from '~/types/retailer/retailer-config.types'
import type { CartData } from '~/types/scraper/cart-page-result.types'
import type { ScrapedCartItem } from '~/types/products/scraped/scraped-cart-product.types'
import type { RetailerInfo } from '~/types/retailer/retailer.types'

const ERROR_CODES = {
  CONFIG: 'CONFIG_ERROR',
  SCRAPE: 'SCRAPE_ERROR',
  ABORT: 'SCRAPE_ABORTED',
} as const

type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES]

type ScrapeResult =
  | { status: 'SUCCESS', data: CartData }
  | { status: 'ERROR', errorCode: ErrorCode }

/**
 * Extracts all item data from the cart page using retailer-specific configurations.
 *
 * This function orchestrates the cart scraping process. It retrieves the appropriate
 * configuration, calls `scrapeCartData` to perform the DOM scraping, cleans any
 * resulting data, and packages it for return. In its current state, it handles
 * initial configuration errors but does not receive a success or failure signal
 * from the scraping process itself; a failed scrape will result in an empty unstable attribution
 * items array but will still be reported as an overall 'SUCCESS'.
 *
 * @param {RetailerInfo} retailer - The identified retailer object for the current page.
 * @returns {Promise<ScrapeResult>} A promise that resolves to a structured result object,
 * indicating either success (with potentially empty data) or a configuration error.
 *
 * @todo Improve scrape reliability by adding validation. The `scrapeCartData`
 * function should be updated to return a boolean indicating its success or failure.
 * `extractCartData` can then check this boolean and return a `{ status: 'ERROR',
 * errorCode: 'SCRAPE_ERROR' }` if it's false. This will properly distinguish
 * between a cart that is truly empty and a page where the selectors failed to find any items.
 */
export async function extractCartData(retailer: RetailerInfo, signal: AbortSignal): Promise<ScrapeResult> {
  // Step 1: Get Config
  const retailerInfo = retailer
  const configResult = getRetailerConfig(retailerInfo)

  // Step 1b: Check if retailer config exists
  if (!configResult) {
    return { status: 'ERROR', errorCode: ERROR_CODES.CONFIG }
  }

  if (signal.aborted)
    return { status: 'ERROR', errorCode: ERROR_CODES.ABORT }

  const { config, activeDomain, retailerName } = configResult

  // Step 1c: Check if cart config exists
  if (!config.cartPage) {
    return { status: 'ERROR', errorCode: ERROR_CODES.CONFIG }
  }

  // Step 2: Initialize CartData object
  const cartData: CartData = {
    retailer: retailerName,
    pageType: 'CART_PAGE',
    items: [],
    collapsedItems: false,
  }

  // Step 3: Scrape Data (populates cartData.items)
  if (signal.aborted)
    return { status: 'ERROR', errorCode: ERROR_CODES.ABORT }

  await scrapeCartData(config.cartPage, cartData, activeDomain.domain)

  // Step 4. Clean scraped data
  if (signal.aborted)
    return { status: 'ERROR', errorCode: ERROR_CODES.ABORT }
  const fieldsToCleanInCartItem: (keyof ScrapedCartItem)[] = ['name', 'uniqueId']
  if (cartData && cartData.items) {
    for (const item of cartData.items) {
      if (item && typeof item === 'object' && item !== null) {
        for (const key of fieldsToCleanInCartItem) {
          const value = item[key]
          if (typeof value === 'string') {
            item[key] = stripHtml(value)
          }
        }
      }
    }
  }

  // return cartData
  if (signal.aborted)
    return { status: 'ERROR', errorCode: ERROR_CODES.ABORT }
  return { status: 'SUCCESS', data: cartData }
}

/**
 * Main scraping logic for the cart page. Finds items and scrapes data for each.
 * Mutates the cartData object passed to it.
 * @param {RetailerPageConfig | undefined} cartPageConfig - Configuration specific to the cart page.
 * @param {CartData} cartData - The main data object to populate (mutated).
 * @param {string} domain - The active domain string.
 */
async function scrapeCartData(cartPageConfig: RetailerPageConfig | undefined, cartData: CartData, domain: string): Promise<void> {
  const domSelectors = cartPageConfig?.dom?.selectors
  const domFunctions = cartPageConfig?.dom?.functions // For handleAdditionalCartLogic

  // Ensure we have selectors and specifically the 'items' selector string
  if (!domSelectors?.items || typeof domSelectors.items !== 'string') {
    return
  }

  try {
    const itemElements = document.querySelectorAll(domSelectors.items)

    itemElements.forEach((itemElement) => {
      const scrapedItem = scrapeSingleCartItem(itemElement, domSelectors, domain)
      if (scrapedItem) {
        cartData.items.push(scrapedItem) // Add valid items to the array
      }
    })

    // Handle retailer-specific additional logic if defined
    if (domFunctions?.handleAdditionalCartLogic && typeof domFunctions.handleAdditionalCartLogic === 'function') {
      try {
        await domFunctions.handleAdditionalCartLogic(cartData, domain)
      }
      catch (e) {
        console.error('Error in handleAdditionalCartLogic:', e)
      }
    }
  }
  catch (error) {
    console.error('Scraper: Error during cart item scraping:', error)
    cartData.items = []
  }
}

/**
 * Scrapes data for a single cart item element based on provided selectors.
 * @param {Element} itemElement - The container DOM element for the cart item.
 * @param {RetailerPageDomSelectors} selectors - The selector functions for this retailer/page.
 * @param {string} domain - The active domain string for creating uniqueIdName.
 * @returns {ScrapedCartItem | null} The scraped cart item data or null if essential info (like name) is missing.
 */
function scrapeSingleCartItem(itemElement: Element, selectors: RetailerPageDomSelectors, domain: string): ScrapedCartItem | null {
  const cartItem: Partial<ScrapedCartItem> = {} // Use Partial initially

  // Iterate through selectors defined in config (excluding 'items' selector itself)
  for (const key in selectors) {
    if (key === 'items' || !Object.prototype.hasOwnProperty.call(selectors, key)) {
      continue
    }

    const selector = selectors[key]
    // Check if it's a function before calling
    if (typeof selector === 'function') {
      try {
        // Pass the itemElement (NOT document) to selector functions for item details
        cartItem[key] = selector(itemElement)
      }
      catch (e) {
        console.error(`Error running selector function for key "${key}":`, e)
      }
    }
    // Handle non-function selectors if necessary (though unlikely based on examples)
  }

  // Generate uniqueIdName - prioritize uniqueId selector, fallback to name (no hashing for now)
  // Add hashing back if needed: const nameHash = await hashString(cartItem.name); const idPart = cartItem.uniqueId || nameHash;
  const idPart = cartItem.uniqueId || cartItem.name // Fallback to name directly
  if (!idPart || typeof idPart !== 'string' || idPart.trim() === '') {
    console.warn('Could not determine uniqueId or name for cart item.', cartItem)
    return null // Cannot identify item
  }
  cartItem.uniqueIdName = `${idPart}-${domain}`

  // Basic validation - ensure item has at least a name to be useful
  if (!cartItem.name) {
    console.warn('Cart item missing name, skipping:', cartItem)
    return null
  }

  // Cast to CartItem after populating essential fields
  return cartItem as ScrapedCartItem
}
