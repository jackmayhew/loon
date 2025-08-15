import { toRaw } from 'vue'
import { cartPageAltsCache } from '~/logic/storage/index'
import type { CartItemAltsPayload } from '~/types/cache/alternative-products/cart-alts.types'

const TTL = 12 * 60 * 60 * 1000 // 12 hours

/**
 * Sets or updates the cached alternatives for a specific cart item.
 *
 * This function creates a new cache object by copying the existing cache and
 * adding or updating the entry for the specified `uniqueId`. Assigning a new
 * object ensures that Vue's reactivity system detects the change reliably.
 *
 * @param {CartItemAltsPayload} cacheData - The payload containing all data for the new cache entry.
 */
export async function setCartItemAlternativesCache(cacheData: CartItemAltsPayload) {
  const { uniqueId, results, errorsOccurred, matchingTerms, possibleTerms, processedInput } = cacheData

  if (!uniqueId || typeof uniqueId !== 'string' || uniqueId.trim() === '') {
    console.error('Cache(CartAlts): Invalid uniqueId provided to set cache.')
    return
  }
  if (!Array.isArray(results)) {
    console.error('Cache(CartAlts): Invalid results data provided (not an array).')
    return
  }

  try {
    const cache = cartPageAltsCache.value
    if (!cache)
      return

    const plainResultsArray = toRaw(results)

    const newEntry = {
      results: plainResultsArray,
      timestamp: Date.now(),
      isOpen: true,
      errorsOccurred,
      matchingTerms,
      possibleTerms,
      processedInput,
    }
    cartPageAltsCache.value = { ...cache, [uniqueId]: newEntry }
  }
  catch (error) {
    console.error('Cache(CartAlts): Error setting cache via direct mutation:', error)
  }
}

/**
 * Iterates through the cart cache and removes all entries that have expired.
 * This should be run periodically, for example, when the cart page is visited.
 */
export function cleanCartCache(): void {
  try {
    const cache = cartPageAltsCache.value
    if (!cache)
      return

    const now = Date.now()
    const allKeys = Object.keys(cache)

    // Build a new object from scratch with only the unexpired entries.
    const newCache = allKeys
      .filter(key => (now - cache[key].timestamp) <= TTL)
      .reduce((acc, key) => {
        acc[key] = cache[key]
        return acc
      }, {} as typeof cache)

    // Only write to storage if something actually changed.
    if (Object.keys(newCache).length !== allKeys.length) {
      cartPageAltsCache.value = newCache
    }
  }
  catch (error) {
    console.error('Cache(CartAlts): Error cleaning expired cart entries:', error)
  }
}
