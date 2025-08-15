/**
 * Singleton composable for managing bookmarked products state and data fetching.
 *
 * This composable manages the complete bookmarks lifecycle:
 * - Fetching detailed product information for bookmarked items
 * - Caching and signature-based validation
 * - Sorting and localization of bookmark data
 * - Pagination with "load more" functionality
 * - Error handling for network failures and validation
 * - Sync with global bookmark changes via watchers
 *
 * Uses module-level reactive state to ensure consistency across all components
 * that import this composable. Features a centralized `executeFetch` helper
 * for clean API calls and simplified error handling with unified retry methods.
 *
 * NOTE: This composable is doing **a lot**. As the app grows,
 * it will be refactored into smaller, more focused composables
 */
import { computed, ref } from 'vue'
import { sendMessage } from 'webext-bridge/popup'
import { useI18n } from 'vue-i18n'
import { bookmarkedProductIndex, initialBookmarkedProductsCache, submittedBookmarkFilters } from '~/logic/storage/index'
import { API_CALL } from '~/constants/system/message-types'
import { API_ENDPOINTS } from '~/constants/api/api'
import type { AlternativeProduct } from '~/types/products/alternative/alternative-product.types'
import type { LanguageKey } from '~/types/language/language.types'
import type { ApiClientResponse } from '~/types/api/common/client-response.types'

const filteredAndSortedIndex = computed(() => {
  // Always start with a fresh copy of the 'master' list
  const items = [...bookmarkedProductIndex.value]

  // --- Apply Filters (will add more here later) ---
  // price range, promo, category, manufacturer (tbd)
  // e.g., if (submittedBookmarkFilters.value.activePromo) { ... }

  // --- Apply Sorting ---
  const order = submittedBookmarkFilters.value.dateOrder
  if (order === 'asc') {
    items.sort((a, b) => a.timestamp - b.timestamp)
  }
  else {
    // 'desc'
    items.sort((a, b) => b.timestamp - a.timestamp)
  }

  return items
})

const products = ref<AlternativeProduct[]>(initialBookmarkedProductsCache.value.results)
const isLoading = ref<boolean>(false)
const triggerLoadMoreLoader = ref<boolean>(false)
const INITIAL_BOOKMARK_CACHE = 5 // Number of bookmarks to cache and display initially
const MAX_AGE_BOOKMARK_CACHE = 21 * 24 * 60 * 60 * 1000 // 3 weeks (product data is pretty static)
const loadedCount = ref<number>(INITIAL_BOOKMARK_CACHE)
const bookmarksCount = computed(() => filteredAndSortedIndex.value.length)

const loadMoreError = ref<string | null>(null)
type FetchAction = 'initialize' | 'sort' | 'locale'
const lastAttemptedAction = ref<FetchAction>('initialize')
const fetchError = ref<string | null>(null)

/**
 * Manages everything related to bookmarked products.
 * Handles fetching, caching, sorting, loading more, and localization.
 */
export function useBookmarkProducts() {
  const { locale } = useI18n()

  /**
   * Updates the global bookmark cache with new product results.
   * @param results - Array of alternative products to cache
   * @param language - Optional language key, defaults to current locale
   */
  function updateBookmarkCache(results: AlternativeProduct[], language?: LanguageKey) {
    initialBookmarkedProductsCache.value = {
      results,
      language: language || locale.value as LanguageKey,
      timeStamp: Date.now(),
    }
  }

  /**
   * A reusable wrapper for all fetch operations.
   * Manages loading states and centralizes try/catch error handling
   * @param actionType - The type of action being performed, for error handling.
   * @param fetchAction - The async function that performs the actual fetch.
   */
  async function executeFetch(
    actionType: FetchAction,
    fetchAction: () => Promise<AlternativeProduct[] | undefined>,
  ) {
    isLoading.value = true
    fetchError.value = null
    lastAttemptedAction.value = actionType

    try {
      const result = await fetchAction()
      if (result) {
        products.value = result
        isLoading.value = false
      }
    }
    catch (err: any) {
      if (err.name !== 'AbortError') {
        setTimeout(() => {
          fetchError.value = err.message || 'An unknown error occurred'
          isLoading.value = false
        }, 500)
      }
      else {
        isLoading.value = false
      }
    }
  }

  /**
   * Fetches product details for an array of IDs and performs self-healing.
   *
   * If the API returns fewer products than requested, it assumes some product IDs
   * were invalid (e.g., deleted from the database). It identifies these "ghost"
   * bookmarks and silently removes them from the global `bookmarkedProductIndex`
   * to maintain data integrity. This triggers a reactive update to fix the UI.
   *
   * @param {string[]} productIds - Array of product IDs to fetch.
   * @param {string} languageId - The language code for the product data.
   * @returns {Promise<AlternativeProduct[] | undefined>} Products or undefined if aborted.
   */
  const fetchProducts = async (productIds: string[], languageId: string): Promise<AlternativeProduct[] | undefined> => {
    if (!productIds || productIds.length === 0) {
      isLoading.value = false
      return []
    }

    const response = await sendMessage<ApiClientResponse<AlternativeProduct[]>>(API_CALL, {
      key: `fetch-bookmarked-products-${languageId}`,
      endpoint: API_ENDPOINTS.FETCH_BOOKMARKED_PRODUCTS,
      method: 'POST',
      body: { productIds, languageId },
    }, 'background')

    if (response.status === 0)
      return undefined

    if (!response.ok)
      throw new Error(`Failed to fetch products: ${response.status}`)

    const fetchedProducts = response.data

    // if we received fewer products than we asked for, an ID was invalid
    if (fetchedProducts.length < productIds.length) {
      const receivedIds = new Set(fetchedProducts.map(p => p.product_id))

      // silently remove the invalid "ghost" bookmarks from the global state.
      bookmarkedProductIndex.value = bookmarkedProductIndex.value.filter(
        bookmark => receivedIds.has(bookmark.id),
      )
    }

    return fetchedProducts
  }

  /**
   * Sets up the initial list of bookmarked products when the component/view loads.
   * Tries to use cached data first, otherwise fetches the first batch.
   */
  const initializeProducts = async () => {
    const cached = initialBookmarkedProductsCache.value
    const isCacheStale = !cached.timeStamp || (Date.now() - cached.timeStamp > MAX_AGE_BOOKMARK_CACHE)
    const currentIds = filteredAndSortedIndex.value.slice(0, INITIAL_BOOKMARK_CACHE).map(p => p.id)
    const cachedIds = cached?.results?.map(p => p.product_id)
    const idsMatch = cached?.results?.length > 0 && currentIds.every((id, i) => id === cachedIds[i])

    // use cached data if it's fresh and matches current state
    if (cached?.results?.length > 0 && locale.value === cached?.language && idsMatch && !isCacheStale) {
      products.value = cached.results
      return
    }

    // pass the action type to executeFetch
    await executeFetch('initialize', async () => {
      const idsToFetch = filteredAndSortedIndex.value.slice(0, INITIAL_BOOKMARK_CACHE).map(p => p.id)
      const fetched = await fetchProducts(idsToFetch, locale.value)
      if (fetched) {
        updateBookmarkCache(fetched, locale.value as LanguageKey)
      }
      return fetched
    })
  }

  /**
   * Fetches and adds the next batch of bookmarked products to the list.
   * Note: Uses its own error handling instead of executeFetch since it appends data rather than replacing it.
   */
  const loadMore = async () => {
    try {
      loadMoreError.value = null
      triggerLoadMoreLoader.value = true

      const nextIds = filteredAndSortedIndex.value
        .slice(loadedCount.value, loadedCount.value + INITIAL_BOOKMARK_CACHE)
        .map(product => product.id)

      const fetchedMoreProducts = await fetchProducts(nextIds, locale.value)

      if (fetchedMoreProducts) {
        products.value = [...products.value, ...fetchedMoreProducts]
        loadedCount.value += INITIAL_BOOKMARK_CACHE
        triggerLoadMoreLoader.value = false
      }
    }
    catch (err: any) {
      if (err.name === 'AbortError') {
        return
      }
      setTimeout(() => {
        isLoading.value = false
        loadMoreError.value = err.message || 'Failed to fetch products'
        triggerLoadMoreLoader.value = false
      }, 500)
    }
  }

  /**
   * Re-fetches and re-renders the products according to the current sort order.
   * Optimizes by sorting locally if all products are already loaded.
   * Will become applyFilters to handle all filtering logic
   */
  const fetchOnSortOrder = async () => {
    const total = bookmarksCount.value
    if (products.value.length === total) {
      // handle local-only sort
      const sortedIds = filteredAndSortedIndex.value.map(item => item.id)
      products.value.sort((a, b) => sortedIds.indexOf(a.product_id) - sortedIds.indexOf(b.product_id))
      products.value = [...products.value]
      return
    }

    // pass the action type to executeFetch
    await executeFetch('sort', async () => {
      const ids = filteredAndSortedIndex.value.slice(0, products.value.length).map(p => p.id)
      const fetched = await fetchProducts(ids, locale.value)
      if (fetched) {
        updateBookmarkCache(fetched.slice(0, INITIAL_BOOKMARK_CACHE))
      }
      return fetched
    })
  }

  /**
   * Re-fetches the currently displayed products in the newly selected language.
   */
  const fetchOnLocaleToggle = async () => {
    await executeFetch('locale', async () => {
      const ids = products.value.map(p => p.product_id)
      const fetched = await fetchProducts(ids, locale.value)
      if (fetched) {
        updateBookmarkCache(fetched.slice(0, INITIAL_BOOKMARK_CACHE), locale.value as LanguageKey)
      }
      return fetched
    })
  }

  const retryFetch = () => {
    const action = lastAttemptedAction.value
    if (action === 'initialize') {
      initializeProducts()
    }
    else if (action === 'sort') {
      fetchOnSortOrder()
    }
    else if (action === 'locale') {
      fetchOnLocaleToggle()
    }
  }

  /**
   * Helper function to find which bookmark was removed
   */
  function findRemovedBookmark(newIndex: any[], oldIndex: any[]): string | null {
    if (newIndex.length >= oldIndex.length)
      return null

    const oldIds = oldIndex.map(i => i.id)
    const removedId = oldIds.find(id => !newIndex.some(i => i.id === id))
    return removedId || null
  }

  /**
   * Removes the product from the current view and updates counters
   */
  function removeProductFromView(removedId: string) {
    const productIndexInView = products.value.findIndex(p => p.product_id === removedId)
    if (productIndexInView !== -1) {
      products.value.splice(productIndexInView, 1)
      loadedCount.value--
    }
  }

  /**
   * Handles cache updates when viewing more than a batch
   */
  function updateCacheForLargeView() {
    updateBookmarkCache(products.value.slice(0, INITIAL_BOOKMARK_CACHE))
  }

  /**
   * Refills products to maintain proper batch size
   */
  async function refillProductsIfNeeded() {
    const remainingTotal = filteredAndSortedIndex.value.length

    if (remainingTotal >= INITIAL_BOOKMARK_CACHE) {
      const idsToFetch = filteredAndSortedIndex.value.slice(0, INITIAL_BOOKMARK_CACHE).map(p => p.id)
      const fetchedProducts = await fetchProducts(idsToFetch, locale.value)

      if (fetchedProducts) {
        products.value = fetchedProducts
        updateBookmarkCache(fetchedProducts)
        loadedCount.value = fetchedProducts.length
      }
    }
    else {
      updateBookmarkCache([...products.value])
    }
  }

  /**
   * Main bookmark removal handler
   */
  async function handleBookmarkRemoval(removedId: string) {
    const wasViewingMoreThanBatch = products.value.length > INITIAL_BOOKMARK_CACHE

    removeProductFromView(removedId)

    if (wasViewingMoreThanBatch) {
      updateCacheForLargeView()
    }
    else {
      await refillProductsIfNeeded()
    }
  }

  /**
   * Watches for global bookmark changes and updates the local view.
   *
   * When a bookmark is removed from anywhere in the app, this watcher
   * runs the complex UI logic needed to update the bookmarks page,
   * like refilling the list to maintain the correct number of visible items.
   */
  watch(bookmarkedProductIndex, async (newIndex, oldIndex) => {
    // Only trigger on removal, and only if the composable is active
    if (!products.value.length)
      return

    const removedId = findRemovedBookmark(newIndex, oldIndex)
    if (removedId) {
      await handleBookmarkRemoval(removedId)
    }
  })

  /**
   * Reset states and kicks off the initial product loading.
   */
  function handleOnMounted() {
    loadedCount.value = INITIAL_BOOKMARK_CACHE
    fetchError.value = null
    loadMoreError.value = null
    initializeProducts()
  }

  return {
    // --- State ---
    products,
    bookmarksCount,
    triggerLoadMoreLoader,
    isLoading,
    fetchError,
    loadedCount,
    loadMoreError,
    // --- Methods ---
    handleOnMounted,
    retryFetch,
    loadMore,
    fetchOnSortOrder,
    fetchOnLocaleToggle,
  }
}
