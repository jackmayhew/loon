/**
 * Singleton composable for managing product search state and API calls.
 *
 * This composable manages the complete search lifecycle:
 * - Initial search execution and caching
 * - Pagination with "load more" functionality
 * - Filter application (provinces, promotions, price ranges)
 * - Error handling for network failures and validation
 * - Cache management with signature-based validation
 *
 * Uses module-level reactive state to ensure consistency across all components
 * that import this composable. The shared state includes loading indicators,
 * error states, and the accumulated results list.
 *
 * NOTE: This composable is doing **a lot**. As the app grows,
 * it will be refactored into smaller, more focused composables
 */

import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { sendMessage } from 'webext-bridge/popup'
import { submittedSearchQuery, submittedSearchResults } from '~/logic/storage/index'
import { API_CALL } from '~/constants/system/message-types'
import { API_ENDPOINTS } from '~/constants/api/api'
import type { AlternativeProduct } from '~/types/products/alternative/alternative-product.types'
import type { LanguageKey } from '~/types/language/language.types'
import type { ApiClientResponse } from '~/types/api/common/client-response.types'
import type { ProductSearchResponse } from '~/types/api/search/response.types'

const isLoading = ref(false)
const isLoadingMore = ref(false)
const initialError = ref<Error | null>(null)
const loadMoreError = ref<Error | null>(null)
const resultsLimit = ref(5)
const currentOffset = ref(0)
const hasMoreResults = ref(false)

/**
 * Local reactive list of all currently visible search results.
 * This list grows when the user clicks "Load More".
 * It is distinct from `submittedSearchResults`, which is a global cache
 * holding only the *initial* batch of results for a given query signature
 */
export const fetchedResults = ref<AlternativeProduct[]>([])

export function useSearchResults() {
  const { locale } = useI18n()

  /**
   * Executes a search API call with the given parameters.
   * This is the single source of truth for all search network requests.
   * @returns An object containing the fetched products and the total count.
   * @throws Will throw an error if the API call fails or is aborted
   */
  async function executeSearch(params: {
    query: string
    language: string
    limit: number
    offset: number
    productId?: string | null
    priceMin?: number | null
    priceMax?: number | null
    provinces?: string[] | null
    promotion?: boolean | null
  }) {
    // 1. Build the search parameters
    const searchParams = new URLSearchParams({
      query: params.query,
      lang: params.language,
      limit: params.limit.toString(),
      offset: params.offset.toString(),
    })

    if (params.productId)
      searchParams.append('productId', params.productId)
    if (params.priceMin)
      searchParams.append('priceMin', params.priceMin.toString())
    if (params.priceMax)
      searchParams.append('priceMax', params.priceMax.toString())
    if (params.provinces?.length)
      searchParams.append('provinces', params.provinces.join(','))
    if (params.promotion)
      searchParams.append('promotion', params.promotion.toString())

    const endpointWithParams = `${API_ENDPOINTS.FULL_SEARCH_PRODUCTS}?${searchParams.toString()}`

    // 2. Make the API call
    const response = await sendMessage<ApiClientResponse<ProductSearchResponse>>(API_CALL, {
      key: `full-product-search-${params.query}-${params.offset}`,
      endpoint: endpointWithParams,
      method: 'GET',
    }, 'background')

    // 3. Handle the response
    if (response.status === 0) {
      const abortError = new Error('Search request was aborted.')
      abortError.name = 'AbortError'
      throw abortError
    }

    if (!response.ok) {
      const errorMsg = response.data?.message || `API error: ${response.status}`
      throw new Error(errorMsg)
    }

    // 4. Return clean data
    return {
      products: response.data.products,
      totalCount: response.data.totalCountIndicator,
    }
  }

  /**
   * Verifies if the cached search results are still valid for the current query.
   */
  function checkCacheValidity() {
    return (
      submittedSearchQuery.value.signature
      && submittedSearchQuery.value.signature === submittedSearchResults.value.signature
      && submittedSearchResults.value.results.length > 0
      && !submittedSearchResults.value.fetchError
    )
  }

  /**
   * Updates the component's state using data from the global cache.
   */
  function restoreResultsFromCache() {
    fetchedResults.value = [...submittedSearchResults.value.results]
    hasMoreResults.value = submittedSearchResults.value.hasMoreResults
    currentOffset.value = submittedSearchResults.value.results.length
    initialError.value = null
    isLoading.value = false
  }

  /**
   * Creates a consistent, unique signature string from a set of search parameters.
   * This is used to validate and bust the cache.
   */
  function generateSignature(params: typeof submittedSearchQuery.value) {
    return JSON.stringify({
      q: params.query,
      l: params.language,
      p: [...(params.provinces || [])].sort(),
      promo: params.promotion,
      pMin: params.priceMin,
      pMax: params.priceMax,
    })
  }

  // Initial fetch
  async function fetchAndStoreResults() {
    // Not sure about caching here. TBD
    // if (checkCacheValidity()) {
    //   restoreResultsFromCache()
    //   return
    // }

    // 1. Get search parameters from the global store
    const searchParams = submittedSearchQuery.value
    if (!searchParams.query || searchParams.query.trim() === '') {
      // If query is empty, clear everything and stop.
      fetchedResults.value = []
      submittedSearchResults.value = { results: [], resultsCount: 0, hasMoreResults: false, signature: '', fetchError: null }
      return
    }

    // 2. Set loading state and clear previous errors
    isLoading.value = true
    initialError.value = null
    fetchedResults.value = []

    try {
      // 3. Call the single, reusable API helper
      const { products, totalCount } = await executeSearch({
        ...searchParams,
        query: searchParams.query,
        limit: resultsLimit.value + 1,
        offset: 0,
      })

      // 4. Process the successful response
      const hasMore = products.length > resultsLimit.value
      const resultsToShow = products.slice(0, resultsLimit.value)

      // Update local state for the view
      fetchedResults.value = resultsToShow
      hasMoreResults.value = hasMore
      currentOffset.value = resultsToShow.length

      // Generate a signature for caching purposes
      const signature = generateSignature(searchParams)

      // Update global state for caching
      submittedSearchResults.value = {
        results: resultsToShow,
        resultsCount: totalCount,
        hasMoreResults: hasMore,
        signature,
        fetchError: null,
      }
      submittedSearchQuery.value.signature = signature
    }
    catch (err: any) {
      // 5. Handle errors from executeSearch
      if (err.name !== 'AbortError') {
        // Ensure ui gets feedback. Pretty jank
        await new Promise(resolve => setTimeout(resolve, 300))
        console.error('Failed to fetch initial search results:', err)
        initialError.value = err
        // Reset state on failure
        fetchedResults.value = []
        hasMoreResults.value = false
      }
    }
    finally {
      // 6. ALWAYS turn off the loading indicator
      isLoading.value = false
    }
  }

  // 'Load More' button
  async function loadMoreResults() {
    // 1. Guard against unnecessary calls
    if (isLoadingMore.value || !hasMoreResults.value)
      return

    const searchParams = submittedSearchQuery.value
    if (!searchParams.query)
      return

    // 2. Set loading state and clear previous errors
    isLoadingMore.value = true
    loadMoreError.value = null

    try {
      // 3. Call the single, reusable API helper with the current offset
      const { products } = await executeSearch({
        ...searchParams,
        query: searchParams.query, // Ensure query is a string
        limit: resultsLimit.value + 1,
        offset: currentOffset.value,
      })

      // 4. Process the successful response
      const hasMore = products.length > resultsLimit.value
      const newResults = products.slice(0, resultsLimit.value)

      // Append new results to the existing list
      fetchedResults.value.push(...newResults)
      hasMoreResults.value = hasMore
      currentOffset.value += newResults.length
    }
    catch (err: any) {
      // 5. Handle errors from executeSearch
      if (err.name !== 'AbortError') {
        console.error('Failed to load more search results:', err)
        loadMoreError.value = err
      }
    }
    finally {
      // 6. ALWAYS turn off the loading indicator
      isLoadingMore.value = false
    }
  }

  async function retryInitialFetch() {
    await fetchAndStoreResults()
  }

  /**
   * Initializes the search results when the view is mounted.
   *
   * It checks if there are valid, cached results that match the current search
   * query's signature. If so, it restores the view from the cache to avoid a
   * network request. Otherwise, it triggers a fresh search
   */
  async function handleOnMounted() {
    if (isLoading.value)
      return

    if (checkCacheValidity()) {
      // Cache is valid, restore the view directly from our global cache
      restoreResultsFromCache()
    }
    else {
      // Otherwise, run a fresh search
      await fetchAndStoreResults()
    }
  }

  /**
   * Prepares and triggers a brand new search from a user query.
   * This resets all filters and generates a new signature.
   */
  function submitNewSearch(query: string | undefined | null) {
    if (!query)
      return

    const newSignature = JSON.stringify({
      q: query,
      l: locale.value,
      p: [],
      promo: undefined,
      pMin: undefined,
      pMax: undefined,
    })

    submittedSearchQuery.value = {
      query,
      language: locale.value as LanguageKey,
      signature: newSignature,
      productId: null,
      priceMin: undefined,
      priceMax: undefined,
      provinces: [],
      promotion: undefined,
    }

    fetchAndStoreResults()
  }

  /**
   * Updates the current search query with new filters, generates a new signature,
   * and initiates a fresh search with the applied filters.
   */
  function applyFilters(newFilters: { provinces: string[], promotion: boolean | null }) {
    const updatedQuery = {
      ...submittedSearchQuery.value,
      provinces: newFilters.provinces,
      promotion: newFilters.promotion,
    }
    updatedQuery.signature = generateSignature(updatedQuery)
    submittedSearchQuery.value = updatedQuery
    fetchAndStoreResults()
  }

  /**
   * Resets the active filters to their default state, generates a new signature,
   * and initiates a fresh search without filter constraints.
   */
  function clearFilters() {
    const clearedQuery = {
      ...submittedSearchQuery.value,
      provinces: [],
      promotion: undefined,
    }
    clearedQuery.signature = generateSignature(clearedQuery)
    submittedSearchQuery.value = clearedQuery
    fetchAndStoreResults()
  }

  return {
    // --- State ---
    results: fetchedResults,
    resultsCount: computed(() => submittedSearchResults.value.resultsCount),
    searchQuery: computed(() => submittedSearchQuery.value),
    isLoading,
    isLoadingMore,
    loadMoreError,
    initialError,
    hasMoreResults,
    // --- Methods ---
    loadMoreResults,
    retryInitialFetch,
    handleOnMounted,
    fetchAndStoreResults,
    submitNewSearch,
    applyFilters,
    clearFilters,
  }
}
