import { computed, onUnmounted, readonly, ref, watch } from 'vue'
import type { Ref } from 'vue'
import { onMessage, sendMessage } from 'webext-bridge/popup'
import { setProductCache, touchProductCacheEntry } from '~/logic/cache/product-page-alternatives'
import { productPageAltsCache } from '~/logic/storage/index'
import { isStartAnalysisResponse } from '~/types/api/analysis/response.types'
import type { AlternativeProduct } from '~/types/products/alternative/alternative-product.types'
import type { SseUpdateMessage } from '~/types/messages/sse.types'
import type { ScrapedProduct } from '~/types/products/scraped/scraped-product.types'
import type { ProductCacheEntry, ProductPageAltsPayload } from '~/types/cache/alternative-products/product-page-alts.types'
import type { LanguageKey } from '~/types/language/language.types'
import {
  SSE_ERROR,
  SSE_UPDATE,
  START_PRODUCT_ANALYSIS,
  START_SSE_LISTENING,
  STOP_SSE_LISTENING,
} from '~/constants/system/message-types'

type FetchStatus = 'IDLE' | 'LOADING' | 'FETCHING' | 'UPDATING' | 'SUCCESS' | 'ERROR'

/**
 * Manages the state and logic for fetching and displaying alternative products for a single product page.
 * It handles the entire lifecycle: initiating the analysis, listening to Server-Sent Events (SSE),
 * managing the cache, and cleaning up resources.
 *
 * @param tabId - Reactive ref for the current tab ID.
 * @param scrapedProduct - Reactive ref for the currently displayed scraped product.
 * @param languageKey - Reactive ref for the active language.
 */
export function useProductAlternatives(
  tabId: Ref<number | null>,
  scrapedProduct: Ref<ScrapedProduct | null>,
  languageKey: Ref<LanguageKey | undefined>,
) {
  // --- Reactive State ---
  const fetchStatus = ref<FetchStatus>('IDLE')
  const sseKey = ref<string | null>(null)
  const activeJobId = ref<string | null>(null)
  const displayCount = ref<number>(5)
  const uniqueIdName = computed(() => scrapedProduct.value?.uniqueIdName)

  let jobTimeoutId: NodeJS.Timeout | null = null

  // --- Internal State Management ---

  /**
   * Resets all temporary fetch-related state to its default idle state.
   */
  function _resetState() {
    if (jobTimeoutId) {
      clearTimeout(jobTimeoutId)
      jobTimeoutId = null
    }
    fetchStatus.value = 'IDLE'
    sseKey.value = null
    activeJobId.value = null
  }

  /**
   * Puts the composable into the 'LOADING' state, ready for a new fetch.
   */
  function _setLoadingState() {
    fetchStatus.value = 'LOADING'
    sseKey.value = 'STATUS_PROCESSING'
  }

  /**
   * Transitions to the 'ERROR' state. All error paths lead here.
   * It logs the error and updates the UI state, where it will persist until a new user action.
   * @param errorType - A string key representing the error.
   */
  async function _setErrorState(errorType: string) {
    if (jobTimeoutId) {
      clearTimeout(jobTimeoutId)
      jobTimeoutId = null
    }
    console.error(`[State Error] Type: ${errorType}, Product: ${uniqueIdName.value ?? 'N/A'}`)
    await new Promise(resolve => setTimeout(resolve, 300)) // Ensure ui gets feedback. Pretty jank
    fetchStatus.value = 'ERROR'
    sseKey.value = 'STATUS_ERROR'
  }

  /**
   * Transitions to the 'FETCHING' state after the backend confirms the job start.
   * Initiates the SSE listener and sets a timeout for stuck jobs.
   * @param jobId - The unique ID for the analysis job from the backend.
   * @param sseToken - The token required for the SSE connection.
   * @param tabId - The ID of the active tab.
   */
  function _setFetchingState(jobId: string, sseToken: string, tabId: number) {
    activeJobId.value = jobId
    fetchStatus.value = 'FETCHING'

    // Timeout for stuck jobs
    jobTimeoutId = setTimeout(() => {
      if (activeJobId.value === jobId && fetchStatus.value === 'FETCHING') {
        _setErrorState('JOB_TIMEOUT')
        sendMessage(STOP_SSE_LISTENING, { jobId: activeJobId.value, tabId }, 'background')
      }
    }, 20000) // 20-second timeout

    sendMessage(START_SSE_LISTENING, { jobId, sseToken, tabId }, 'background')
      .catch((err) => {
        if (jobTimeoutId)
          clearTimeout(jobTimeoutId)
        console.error('[State Fetching] Error sending START_SSE_LISTENING:', err)
        _setErrorState('SSE_START_FAILED')
      })
  }

  /**
   * Handles the successful completion of an alternative search.
   * Parses the final payload, saves valid results to the cache, and
   * transitions the UI to a final 'SUCCESS' state before resetting.
   * @param payload - The final data payload from the SSE_UPDATE message.
   */
  async function _setSuccessState(payload: SseUpdateMessage['data']) {
    const uniqueId = uniqueIdName.value
    if (!uniqueId)
      return

    _resetState() // Reset immediately on success

    const alternatives = payload.resultPayload?.alternativeProducts || []
    // We do not cache empty results for the product page
    if (alternatives.length > 0) {
      const cacheData: ProductPageAltsPayload = {
        uniqueId,
        results: alternatives,
        errorsOccurred: payload.resultPayload?.errorsOccurred || false,
        matchingTerms: payload.resultPayload?.matchingTerms ?? null,
        possibleTerms: payload.resultPayload?.possibleTerms ?? null,
        processedInput: payload.resultPayload?.processedInput ?? null,
      }
      try {
        await setProductCache(cacheData)
      }
      catch (err) {
        console.error('[State Success] Failed to save cache:', err)
        // Note: We don't enter an error state here as the user already has the results.
      }
    }
  }

  // --- Public Methods & Event Handlers ---

  /**
   * Updates the number of alternative products to display.
   * @param count - The new number of items to show.
   */
  function handleDisplayCountUpdate(count: number) {
    displayCount.value = count
  }

  /**
   * The core function to trigger fetching alternatives for the current product.
   * It validates input, sets the loading state, and sends the initial message to the background script.
   */
  async function fetchProductAlternatives() {
    const productData = scrapedProduct.value
    if (!productData || !tabId.value) {
      _setErrorState('MISSING_PRODUCT_DATA')
      return
    }

    _setLoadingState()

    try {
      const rawProductData = JSON.parse(JSON.stringify(productData))
      const result = await sendMessage(
        START_PRODUCT_ANALYSIS,
        { productData: rawProductData, languageKey: languageKey.value ?? null },
        'background',
      )

      if (isStartAnalysisResponse(result)) {
        const response = result
        if (response.status === 'started') {
          _setFetchingState(response.jobId, response.sseToken, tabId.value)
        }
        else {
          _setErrorState('JOB_START_FAILED')
        }
      }
    }
    catch (error) {
      console.error('[Product Page Alternatives] Failed to save cache:', error)
      _setErrorState('API_HANDLER_ERROR')
    }
  }

  /** Handles incoming SSE update messages, routing them to the correct state handler. */
  onMessage<SseUpdateMessage>(SSE_UPDATE, ({ data }) => {
    const { jobId, data: payload } = data
    if (activeJobId.value !== jobId)
      return

    const { message, step } = payload
    if (message === 'STATUS_SUCCESSFUL' || step === 100) {
      _setSuccessState(payload)
      fetchStatus.value = 'SUCCESS' // Set final success status for the UI
    }
    else if (message === 'STATUS_ERROR' || step === -99) {
      _setErrorState('SSE_PROCESSING_ERROR')
    }
    else if (message) {
      sseKey.value = message
      fetchStatus.value = 'UPDATING'
    }
  })

  /** Handles SSE connection errors, transitioning the component to an error state. */
  onMessage<{ jobId: string, message: string }>(SSE_ERROR, ({ data }) => {
    if (activeJobId.value !== data.jobId)
      return
    _setErrorState('SSE_CONNECTION_ERROR')
  })

  // --- Cache Computed Properties & Watchers ---

  const currentProductCacheEntry = computed<ProductCacheEntry | null>(() => {
    const id = uniqueIdName.value
    return id ? (productPageAltsCache.value?.[id] || null) : null
  })

  const currentProductCacheEntryAlts = computed<AlternativeProduct[] | null>(() => {
    return currentProductCacheEntry.value?.results ?? null
  })

  watch(uniqueIdName, (newId, oldId) => {
    if (newId !== oldId) {
      _resetState()
    }
  })

  // --- Initialization ---
  touchProductCacheEntry(uniqueIdName.value) // Run cache clean once on setup

  // --- Cleanup ---
  onUnmounted(() => {
    if (activeJobId.value) {
      sendMessage(STOP_SSE_LISTENING, { jobId: activeJobId.value }, 'background')
    }
  })

  // --- Return Values ---
  return {
    fetchStatus: readonly(fetchStatus),
    sseKey: readonly(sseKey),
    displayCount: readonly(displayCount),
    uniqueIdName: readonly(uniqueIdName),
    currentProductCacheEntry,
    currentProductCacheEntryAlts: readonly(currentProductCacheEntryAlts),
    fetchProductAlternatives,
    handleDisplayCountUpdate,
  }
}
