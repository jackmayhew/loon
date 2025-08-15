/**
 * NOTE ON THIS FILE'S STRUCTURE:
 *
 * The base `ViewData` interface is intentionally loose. It's designed to match
 * how data objects are constructed in the background script, where many properties
 * are optional depending on the context.
 *
 * The more specific types (`ProductPageViewData`, `CartPageViewData`) are strict.
 * They are used inside the Vue components to guarantee that the data they receive
 * has the exact shape they need, providing strong type safety where it matters most.
 */

import type { ScrapedProduct } from '../products/scraped/scraped-product.types'
import type { ScrapedCartItem } from '../products/scraped/scraped-cart-product.types'
import type { DomStatus } from './dom-status.types'
import type { PageType } from './page-type.types'

export interface Retailer {
  id: string
  domain_key: string
  name: string
  [key: string]: any
}

/**
 * The unified shape for all view data. This is the "loosest" type,
 * representing data as it is stored in the cache or created in the background.
 * Most properties are optional.
 */
export interface ViewData {
  pageType: PageType | null
  domStatus: DomStatus
  url?: string | null
  errorCode?: string | null
  isRefreshing?: boolean
  timestamp?: number
  retailer?: Retailer | null
  scrapeStatus?: 'NEEDS_SCRAPE' | 'SUCCESS' | 'ERROR' | 'WAITING' | 'SCRAPING' | null
  isCaDomain?: boolean
  productData?: { data: ScrapedProduct } | null
  items?: ScrapedCartItem[] | null
  collapsedItems?: boolean
}

/**
 * A stricter, specific type for when we know we are on a Product Page.
 * This is what your components should use in their props.
 * It takes the base ViewData and makes product-specific properties required.
 */
export type ProductPageViewData = ViewData & {
  pageType: 'PRODUCT_PAGE'
  productData: ScrapedProduct
  retailer: Retailer
}

/**
 * A stricter, specific type for when we know we are on a Cart Page.
 */
export type CartPageViewData = ViewData & {
  pageType: 'CART_PAGE'
  items: ScrapedCartItem[]
  retailer: Retailer
}
