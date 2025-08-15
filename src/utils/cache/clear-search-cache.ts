import { submittedSearchQuery, submittedSearchResults } from '~/logic/storage/index'

/**
 * Partially resets the search query state and completely clears search results.
 *
 * This is designed to run when a view re-mounts after a rate limit or service unavailable.
 * It intentionally preserves the core search parameters (`query`, `language`, `productId`)
 * while clearing filters and control flags (`signature`, `priceMin`, etc.) to allow
 * the original search to be re-triggered cleanly.
 */
export function clearSearchCache() {
  // Preserve the core query but reset filters and the signature.
  submittedSearchQuery.value = {
    ...submittedSearchQuery.value, // Keeps query, language, productId
    signature: '', // Clears signature
    priceMin: undefined, // Clears filters
    priceMax: undefined,
    provinces: [],
    promotion: null,
    trigger: 0, // Resets trigger
  }

  // Completely reset the cached search results.
  submittedSearchResults.value = {
    results: [],
    resultsCount: 0,
    hasMoreResults: false,
    signature: '',
    fetchError: null,
  }
}
