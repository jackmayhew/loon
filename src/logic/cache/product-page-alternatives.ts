import { toRaw } from 'vue'
import { productPageAltsCache } from '~/logic/storage/index'
import type { ProductPageAltsPayload } from '~/types/cache/alternative-products/product-page-alts.types'

const TTL = 12 * 60 * 60 * 1000 // 12 hours

/**
 * Updates the timestamp for a given entry and cleans out any other expired entries.
 *
 * This function is critical for maintaining the cache. It works by building a
 * completely new cache object from the old one. It keeps non-expired entries,
 * updates the timestamp of the "touched" entry, and discards all others.
 * Assigning a new object is essential to trigger Vue's reactivity system reliably.
 *
 * @param {string} uniqueId - The unique identifier of the cache entry to "touch".
 */
export function touchProductCacheEntry(uniqueId: string): void {
  if (!uniqueId || typeof uniqueId !== 'string' || uniqueId.trim() === '') {
    console.error('Cache: Invalid uniqueId for touchProductCacheEntry:', uniqueId)
    return
  }

  try {
    const cache = productPageAltsCache.value
    if (!cache)
      return

    const now = Date.now()
    const allKeys = Object.keys(cache)

    // Rebuild the cache object from scratch to ensure reactivity.
    const newCache = allKeys.reduce((acc, key) => {
      const entry = cache[key]
      if (!entry)
        return acc

      // If this is the entry we're touching, update its timestamp.
      if (key === uniqueId) {
        acc[key] = { ...entry, timestamp: now }
      }
      // Otherwise, keep it only if it has not expired.
      else if (now - entry.timestamp <= TTL) {
        acc[key] = entry
      }
      // Expired entries are implicitly dropped by not being added to the accumulator.

      return acc
    }, {} as typeof cache)

    productPageAltsCache.value = newCache
  }
  catch (error) {
    console.error('Cache: Error in touchProductCacheEntry:', error)
  }
}

/**
 * Sets or updates an entry in the product alternatives cache.
 *
 * This function works by creating a new cache object containing all old entries
 * plus the new or updated entry. Assigning a completely new object to the .value
 * is crucial for ensuring Vue's reactivity system reliably detects the change.
 *
 * @param {object} cacheData - The payload containing all data for the cache entry.
 */
export function setProductCache(cacheData: ProductPageAltsPayload): void {
  const { uniqueId, results, errorsOccurred, matchingTerms, possibleTerms, processedInput } = cacheData

  if (!uniqueId || typeof uniqueId !== 'string' || uniqueId.trim() === '') {
    console.error('Cache: Invalid uniqueId for setProductCache:', uniqueId)
    return
  }

  try {
    const cache = productPageAltsCache.value
    if (!cache)
      return

    const plainResultsArray = toRaw(results)

    const newEntry = {
      results: plainResultsArray,
      timestamp: Date.now(),
      errorsOccurred,
      matchingTerms,
      possibleTerms,
      processedInput,
    }

    // Create a new object to ensure reactivity is triggered.
    productPageAltsCache.value = {
      ...cache,
      [uniqueId]: newEntry,
    }
  }
  catch (error) {
    console.error('Cache: Error setting cache:', error)
  }
}
