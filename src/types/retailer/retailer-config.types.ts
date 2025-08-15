import type { ProductPageData } from '~/types/scraper/product-page-result.types'
import type { ActiveDomain } from '~/types/retailer/retailer.types'

/**
 * Type definitions for retailer scraping configurations
 * Defines the structure for DOM selectors, JSON-LD parsing, and custom scraping logic
 */

/** Represents a function that selects data from the DOM */
export type SelectorFunc = (target: Document | Element) => string | boolean | number | null | undefined

/** DOM selectors */
export interface RetailerPageDomSelectors {
  items?: string // Typically a selector string for lists
  [key: string]: ((...args: any[]) => any) | string | undefined
}

/** Language detection configuration */
export interface LanguageConfig {
  source: 'cookie' | 'root' | 'selector' // Where to look
  key?: string // The cookie name or CSS selector
  regex?: string // For complex values, like 'lang:([^|;]+)'
}

/** JSON-LD configuration */
export interface RetailerPageJsonLdConfig {
  schemaType: string
  selectors: {
    // Maps a desired field name (e.g., 'name') to its JSON-LD path info
    [key: string]: { path: string | string[], slice?: number }
  }
  functions?: {
    // Function to extract value from parsed JSON-LD
    getJsonLdValue: (data: any, path: string | string[]) => any
    // Optional function to process image URLs
    processJsonLdImg?: (url: string) => string
  }
}

/** Custom scraping logic within a page config */
export interface RetailerPageCustomScrapingConfig {
  type?: string
  functions?: {
    customScrapingLogic?: (doc: Document, productData: ProductPageData, activeDomain: ActiveDomain) => Promise<boolean>
  }
}

/** Configuration for DOM-based scraping on a specific page */
export interface RetailerPageDomConfig {
  container?: string
  primaryWaitSelector?: string
  criticalSelectors?: string[]
  selectors?: RetailerPageDomSelectors
  functions?: {
    [key: string]: (...args: any[]) => any
  }
}

/** Combined configuration for a specific page type (e.g., productPage, cartPage) */
export interface RetailerPageConfig {
  dom?: RetailerPageDomConfig
  jsonLd?: RetailerPageJsonLdConfig
  customScraping?: RetailerPageCustomScrapingConfig
}

/** The overall configuration structure for a single retailer */
export interface RetailerConfig {
  productPage?: RetailerPageConfig
  cartPage?: RetailerPageConfig
  language?: LanguageConfig
}

/** Represents the map holding configurations for all supported retailers */
export type ConfigMap = Record<string, RetailerConfig>

/** The structure returned by the getRetailerConfig utility function */
export interface RetailerConfigResult {
  config: RetailerConfig
  activeDomain: ActiveDomain
  retailerName: string
}
