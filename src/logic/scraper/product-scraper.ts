import { hashString } from '~/utils/misc/hash-string'
import { getRetailerConfig } from '~/logic/config/get-retailer-config'
import { getAndCleanScrapedProductCache, setScrapedProductCache } from '~/logic/cache/product-page-scrape'
import { stripHtml } from '~/utils/formatters/strip-html'
import type { ScrapedProduct } from '~/types/products/scraped/scraped-product.types'
import type { ProductPageData } from '~/types/scraper/product-page-result.types'
import type { RetailerConfig } from '~/types/retailer/retailer-config.types'
import type { RetailerInfo } from '~/types/retailer/retailer.types'

const ERROR_CODES = {
  CONFIG: 'CONFIG_ERROR',
  RAINFOREST: 'RAINFOREST_ERROR',
  SCRAPE: 'SCRAPE_ERROR',
  ABORT: 'SCRAPE_ABORTED',
} as const

type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES]

type ScrapeResult =
  | { status: 'SUCCESS', data: ProductPageData }
  | { status: 'ERROR', errorCode: ErrorCode }

/**
 * Extracts product data from the current page using retailer-specific configuration.
 *
 * Workflow:
 * - Retrieves the current retailer's scraping config.
 * - Generates a unique ID for the product using the config and DOM.
 * - Checks the local cache for a previous scrape using the unique ID.
 * - If no cached data, performs scraping using JSON-LD, custom logic, and DOM selectors.
 * - Validates that required fields (name, category) are present.
 * - Caches and returns the scraped product data.
 *
 * @returns {Promise<ScrapeResult>} An object with status 'SUCCESS' and scraped data,
 * or 'ERROR' with an error code if scraping fails at any step.
 *
 * @todo Improve typing in helpers (e.g. scraping and JSON-LD logic),
 * and eventually replace this with api interception
 */
export async function extractProductData(retailer: RetailerInfo, signal: AbortSignal): Promise<ScrapeResult> {
  // Step 1: Get config
  const retailerInfo = retailer
  const configResult = getRetailerConfig(retailerInfo)

  // Step 1b: Check if retailer config exists
  if (!configResult) {
    console.error('Scraper: Could not get retailer config. Aborting.')
    return { status: 'ERROR', errorCode: ERROR_CODES.CONFIG }
  }

  if (signal.aborted)
    return { status: 'ERROR', errorCode: ERROR_CODES.ABORT }

  const { config, activeDomain, retailerName } = configResult

  // Step 1c: Check if productPage config exists
  if (!config.productPage) {
    console.error('Scraper: Could not get retailer config. Aborting.')
    return { status: 'ERROR', errorCode: ERROR_CODES.CONFIG }
  }

  // Step 2: Generate uniqueIdName for cache lookup
  const uniqueIdName = await generateUniqueIdName(config, document, activeDomain.domain)

  if (!uniqueIdName) {
    console.error('Scraper: Failed to generate a valid uniqueIdName.')
    return { status: 'ERROR', errorCode: ERROR_CODES.CONFIG }
  }

  if (signal.aborted)
    return { status: 'ERROR', errorCode: ERROR_CODES.ABORT }

  // Step 2b: Check Cache
  const cachedData = getAndCleanScrapedProductCache(uniqueIdName)
  if (cachedData) {
    return { status: 'SUCCESS', data: cachedData }
  }

  // Step 3: Build initial productData
  const productData: ProductPageData = {
    retailer: retailerName,
    pageType: 'PRODUCT_PAGE',
    data: { uniqueIdName } as ScrapedProduct,
  }

  // Step 4: Attempt jsonLd scrape
  extractJsonLd(config.productPage?.jsonLd, productData)

  if (signal.aborted)
    return { status: 'ERROR', errorCode: ERROR_CODES.ABORT }

  scrapeProductPageDom(config.productPage?.dom?.selectors, productData)

  if (signal.aborted)
    return { status: 'ERROR', errorCode: ERROR_CODES.ABORT }

  /**
   * Executes optional custom scraping logic if configured.
   *
   * This step can have two modes depending on the retailer's strategy:
   * 1.  **Critical Step (e.g., Amazon API):** If the custom logic is the *only*
   *     reliable source of data, it must return `false` on failure, which will
   *     halt the entire extraction process.
   * 2.  **Optimization Step (e.g., Shoppers __NEXT_DATA__):** If the custom
   *     logic is just a faster alternative to DOM scraping, it should always
   *     return `true`, allowing the process to fall back to the DOM selectors
   *     on failure.
   */
  const customScrapingLogic = config?.productPage?.customScraping?.functions?.customScrapingLogic
  if (customScrapingLogic) {
    const success = await customScrapingLogic(document, productData, activeDomain)
    if (!success)
      return { status: 'ERROR', errorCode: ERROR_CODES.RAINFOREST }
  }

  if (signal.aborted)
    return { status: 'ERROR', errorCode: ERROR_CODES.ABORT }

  // Step 6: Ensure minimum required data was scraped
  if (!productData.data.name || !productData.data.description || !productData.data.image) {
    return { status: 'ERROR', errorCode: ERROR_CODES.SCRAPE }
  }

  // Step 7. Clean scraped data
  const fieldsToClean: (keyof ScrapedProduct)[] = ['name', 'description', 'uniqueId']
  for (const key of fieldsToClean) {
    if (productData.data && typeof productData.data[key] === 'string') {
      productData.data[key] = stripHtml(productData.data[key])
    }
  }

  if (signal.aborted)
    return { status: 'ERROR', errorCode: ERROR_CODES.ABORT }

  //  Step 8: Cache and send productData to popup
  try {
    setScrapedProductCache(uniqueIdName, productData)
  }
  catch (e) {
    console.error('Error sending/caching message:', e)
  }

  // await new Promise(resolve => setTimeout(resolve, 10000))
  if (signal.aborted)
    return { status: 'ERROR', errorCode: ERROR_CODES.ABORT }

  return { status: 'SUCCESS', data: productData }
}

/**
 * Finds and parses the JSON-LD script matching the configured schemaType.
 * @param {any} jsonLdConfig - Config object for JSON-LD parsing.
 * @param {ProductPageData} productData - Data object to potentially populate.
 * @returns {ProductPageData | null} Modified productData or null if no match.
 */
function extractJsonLd(jsonLdConfig: any, productData: any) {
  if (!jsonLdConfig)
    return null

  const scripts = document.querySelectorAll('script[type="application/ld+json"]')
  for (const script of Array.from(scripts)) {
    try {
      const data = script.textContent ? JSON.parse(script.textContent) : null
      if (data['@type'] === jsonLdConfig.schemaType
        || (data['@graph'] && data['@graph'].some((item: any) => item['@type'] === jsonLdConfig.schemaType))) {
        return formatJsonLdData(jsonLdConfig, productData, data)
      }
    }
    catch (e) {
      console.error('Error parsing JSON-LD:', e)
    }
  }
  return null
}

/**
 * Extracts values from parsed JSON-LD using configured paths/selectors.
 * Mutates productData only for fields not already populated.
 * @param {any} jsonLdConfig - Config object for JSON-LD parsing.
 * @param {ProductPageData} productData - Data object to populate (mutated).
 * @param {any} data - Parsed JSON-LD object.
 * @returns {ProductPageData} The mutated productData object.
 */
function formatJsonLdData(jsonLdConfig: any, productData: any, data: any) {
  for (const key in jsonLdConfig.selectors) {
    if (Object.prototype.hasOwnProperty.call(jsonLdConfig.selectors, key)) {
      const selector = jsonLdConfig.selectors[key]
      const functions = jsonLdConfig.functions
      const valuePath = selector.path
      const value = functions.getJsonLdValue(data, valuePath)?.toString()
      const sliceLength = selector.slice || undefined

      // Allow for custom processing of image URLs
      if (functions.processJsonLdImg && key === 'image' && value && !productData.data[key]) {
        productData.data[key] = functions.processJsonLdImg(value)
      }
      else if (value && !productData.data[key]) {
        productData.data[key] = value.slice(0, sliceLength)
      }
    }
  }
  return productData
}

/**
 * Scrapes data using DOM selector functions from the config.
 * Populates fields in productData only if they are currently empty.
 * Mutates productData.
 * @param {any} domSelectors - Config object with selector functions.
 * @param {ProductPageData} productData - Data object to populate (mutated).
 * @returns {ProductPageData | null} Mutated productData or null on error.
 */
function scrapeProductPageDom(domSelectors: any, productData: any): ProductPageData | null {
  if (!domSelectors)
    return productData

  try {
    for (const key in domSelectors) {
      if (Object.prototype.hasOwnProperty.call(domSelectors, key)) {
        // Only update object if property is empty
        if (typeof domSelectors[key] === 'function' && !productData.data[key]) {
          // productData.data[key] = 'test'
          productData.data[key] = domSelectors[key](document)
        }
      }
    }
    return productData
  }
  catch (error) {
    console.error('Error scraping product data:', error)
    return null
  }
}

/**
 * Generates a unique identifier string for caching (ID-domain or Hash(Name)-domain).
 * @param {RetailerConfig} config - The retailer's configuration object.
 * @param {Document} document - The page's document object.
 * @param {string} domain - The active domain string.
 * @returns {Promise<string | null>} A promise resolving to the unique ID string or null.
 */
export async function generateUniqueIdName(config: RetailerConfig, document: Document, domain: string): Promise<string | null> {
  const uniqueIdSelector = config?.productPage?.dom?.selectors?.uniqueId
  const nameSelector = config?.productPage?.dom?.selectors?.name

  const uniqueId = typeof uniqueIdSelector === 'function'
    ? uniqueIdSelector(document)
    : null

  if (uniqueId)
    return `${uniqueId}-${domain}`

  const productName = typeof nameSelector === 'function'
    ? nameSelector(document)
    : null

  const productNameHashed = productName ? await hashString(productName) : null

  if (productNameHashed)
    return `${productNameHashed}-${domain}`

  return null
}
