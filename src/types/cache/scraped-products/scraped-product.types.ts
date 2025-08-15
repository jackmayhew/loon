import type { ProductPageData } from '~/types/scraper/product-page-result.types'

export interface ScrapedCacheEntry {
  data: ProductPageData
  timestamp: number
  success?: boolean | null
}

export interface ScrapedProductCache {
  [uniqueIdName: string]: ScrapedCacheEntry
}
