import { scrapedProductCache } from '~/logic/storage/index'
import type { ProductPageData } from '~/types/scraper/product-page-result.types'

const TTL = 24 * 60 * 60 * 1000 // 24 hours (Rainforest API is expensive)

/**
 * Gets a cache entry while performing maintenance (cleaning expired entries and updating the timestamp).
 *
 * This is the primary function for reading from the scrape cache. It works by building
 * a new cache object to ensure Vue's reactivity is triggered reliably. It iterates
 * through the old cache, discards expired entries, and updates the timestamp of the requested entry
 *
 * @param {string} uniqueIdName - The unique key for the product page.
 * @returns {ProductPageData | null} The cached data object or null if not found.
 */
export function getAndCleanScrapedProductCache(uniqueIdName: string): ProductPageData | null {
  if (!uniqueIdName)
    return null

  try {
    const cache = scrapedProductCache.value
    if (!cache)
      return null

    const now = Date.now()
    let dataToReturn: ProductPageData | null = null
    let hasChanged = false

    // Rebuild the cache object from scratch to ensure reactivity.
    const newCache = Object.keys(cache).reduce((acc, key) => {
      const entry = cache[key]
      if (!entry) {
        hasChanged = true
        return acc
      }

      // If this is the entry we're looking for, update its timestamp and store its data.
      if (key === uniqueIdName) {
        acc[key] = { ...entry, timestamp: now }
        dataToReturn = entry.data ?? null
        // If the timestamp changed, the cache has changed.
        if (entry.timestamp !== now)
          hasChanged = true
      }
      // Otherwise, keep it only if it has not expired.
      else if (now - entry.timestamp <= TTL) {
        acc[key] = entry
      }
      // If we are here, the entry is expired and dropped, so the cache has changed.
      else {
        hasChanged = true
      }
      return acc
    }, {} as typeof cache)

    // Only write to storage if the cache has actually been modified.
    if (hasChanged) {
      scrapedProductCache.value = newCache
    }

    return dataToReturn
  }
  catch (error) {
    console.error('Cache(Scraper): Error in getAndCleanScrapedProductCache:', error)
    return null
  }
}

/**
 * Sets or updates an entry in the scraped product cache.
 *
 * It creates a new cache object by copying the existing cache and adding/updating
 * the specified entry. Assigning a new object is essential for triggering Vue's
 * reactivity system reliably.
 *
 * @param {string} uniqueIdName - The unique key for the product page.
 * @param {ProductPageData} productData - The complete scraped data object to cache.
 * @param {boolean | null} [success] - Optional flag indicating if the scrape was successful.
 */
export function setScrapedProductCache(uniqueIdName: string, productData: ProductPageData, success?: boolean | null): void {
  if (!uniqueIdName || !productData) {
    console.error('Cache(Scraper): Invalid uniqueIdName or productData for set')
    return
  }

  try {
    const cache = scrapedProductCache.value
    if (!cache)
      return

    const newEntry = { data: productData, timestamp: Date.now(), success }

    // Create a new object to ensure reactivity is triggered.
    scrapedProductCache.value = {
      ...cache,
      [uniqueIdName]: newEntry,
    }
  }
  catch (error) {
    console.error('Cache(Scraper): Error setting cache via direct mutation:', error)
  }
}
