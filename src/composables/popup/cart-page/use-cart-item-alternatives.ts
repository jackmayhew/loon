import { onUnmounted, readonly, ref } from 'vue'
import type { Ref } from 'vue'
import { onMessage, sendMessage } from 'webext-bridge/popup'
import { cartPageAltsCache } from '~/logic/storage/index'
import { cleanCartCache, setCartItemAlternativesCache } from '~/logic/cache/cart-alternatives'
import { isStartAnalysisResponse } from '~/types/api/analysis/response.types'
import type { ScrapedCartItem } from '~/types/products/scraped/scraped-cart-product.types'
import type { SseUpdateMessage } from '~/types/messages/sse.types'
import type { LanguageKey } from '~/types/language/language.types'
import type { CartItemAltsPayload } from '~/types/cache/alternative-products/cart-alts.types'
import {
  SSE_ERROR,
  SSE_UPDATE,
  START_CART_ITEM_ANALYSIS,
  START_SSE_LISTENING,
  STOP_SSE_LISTENING,
} from '~/constants/system/message-types'

type FetchStatus = 'IDLE' | 'LOADING' | 'FETCHING' | 'SUCCESS' | 'ERROR'

/**
 * Manages fetching and caching alternatives for individual items in the cart.
 * Handles SSE communication and state updates related to the fetching process.
 *
 * @param tabId - Reactive ref for the current tab ID.
 * @param cartDataItems - Reactive ref for the currently displayed scraped product.
 * @param languageKey - Reactive ref for the active language.
 */
export function useCartItemAlternatives(
  tabId: Ref<number | null>,
  cartDataItems: Ref<ScrapedCartItem[]>,
  languageKey: Ref<LanguageKey | undefined>,
) {
  // --- Reactive State ---
  const fetchStatus = ref<FetchStatus>('IDLE')
  const fetchUniqueId = ref<string | null>(null) // ID of the item being fetched
  const sseKey = ref<string>('') // UI message during fetch (from SSE)
  const itemErrors = ref<Record<string, string>>({})
  const itemResultsLength = ref<Record<string, number | null>>({})
  const itemDisplayCount = ref<Record<string, number | null>>({})
  const activeJobId = ref<string | null>(null)
  const noResultsOpenState = ref<Record<string, boolean>>({})

  let jobTimeoutId: NodeJS.Timeout | null = null

  // --- Internal State Management ---

  /**
   * Resets all temporary fetch-related state to its default idle state.
   * This is the single source of truth for clearing an active operation.
   */
  function _resetState() {
    if (jobTimeoutId) {
      clearTimeout(jobTimeoutId)
      jobTimeoutId = null
    }
    fetchStatus.value = 'IDLE'
    fetchUniqueId.value = null
    sseKey.value = ''
    activeJobId.value = null
  }

  /**
   * Puts the composable into the 'LOADING' state for a specific item.
   * This clears any previous errors and sets the initial UI message.
   * @param itemId The unique ID of the cart item being processed.
   */
  function _setLoadingState(itemId: string) {
    if (itemErrors.value[itemId])
      delete itemErrors.value[itemId]
    itemResultsLength.value[itemId] = null

    fetchUniqueId.value = itemId
    fetchStatus.value = 'LOADING'
    sseKey.value = 'STATUS_PROCESSING'
  }

  /**
   * Transitions to the 'ERROR' state. All error paths lead here.
   * The state will persist until the user initiates another action.
   */
  async function _setErrorState(errorType: string, itemId?: string) {
    if (jobTimeoutId) {
      clearTimeout(jobTimeoutId)
      jobTimeoutId = null
    }

    console.error(`[State Error] Type: ${errorType}, ItemID: ${itemId ?? 'N/A'}`)
    await new Promise(resolve => setTimeout(resolve, 300)) // Ensure ui gets feedback. Pretty jank
    const targetItemId = itemId || fetchUniqueId.value
    if (targetItemId)
      itemErrors.value[targetItemId] = errorType

    fetchStatus.value = 'ERROR'
    sseKey.value = 'STATUS_ERROR'
  }

  /**
   * Transitions to the 'FETCHING' state after the backend confirms the job start.
   * This function is responsible for initiating the SSE listener.
   */
  function _setFetchingState(jobId: string, sseToken: string, tabId: number) {
    if (jobTimeoutId)
      clearTimeout(jobTimeoutId)

    activeJobId.value = jobId
    fetchStatus.value = 'FETCHING'

    // Timeout for stuck jobs
    jobTimeoutId = setTimeout(() => {
      if (activeJobId.value === jobId && fetchStatus.value === 'FETCHING') {
        _setErrorState('JOB_TIMEOUT', fetchUniqueId.value ?? undefined)
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
   * It saves results to the cache and immediately resets the component to idle.
   * @param payload The final data payload from the SSE_UPDATE message.
   */
  async function _setSuccessState(payload: SseUpdateMessage['data']) {
    const uniqueId = fetchUniqueId.value
    if (!uniqueId)
      return

    const resultsArray = payload.resultPayload?.alternativeProducts || []
    itemResultsLength.value[uniqueId] = resultsArray.length

    if (resultsArray.length > 0) {
      const cacheData: CartItemAltsPayload = {
        uniqueId,
        results: resultsArray,
        errorsOccurred: payload.resultPayload?.errorsOccurred || false,
        matchingTerms: payload.resultPayload?.matchingTerms ?? null,
        possibleTerms: payload.resultPayload?.possibleTerms ?? null,
        processedInput: payload.resultPayload?.processedInput ?? null,
      }
      try {
        await setCartItemAlternativesCache(cacheData)
        if (cartPageAltsCache.value[uniqueId])
          cartPageAltsCache.value[uniqueId].isOpen = true
      }
      catch (err) {
        console.error('[Cart Alternatives] Failed to save cache:', err)
        _setErrorState('CACHE_SAVE_FAILED', uniqueId)
        return
      }
    }
    else {
      // For no results, set its open state locally
      noResultsOpenState.value[uniqueId] = true
    }

    // On success, simply reset to idle
    _resetState()
  }

  // --- Public Methods & Event Handlers ---

  /**
   * Toggles or explicitly sets the 'isOpen' state for an item's alternatives in the cache.
   * @param itemId The uniqueIdName of the cart item.
   * @param forceState If provided, sets state explicitly. If omitted, toggles.
   */
  function setIsOpen(itemId: string, forceState?: boolean) {
    // If the item exists in the main cache, toggle it there.
    if (cartPageAltsCache.value?.[itemId]) {
      const cachedItem = cartPageAltsCache.value[itemId]
      const openState = (typeof forceState === 'boolean') ? forceState : !cachedItem.isOpen
      cartPageAltsCache.value[itemId] = { ...cachedItem, isOpen: openState, timestamp: Date.now() }
    }
    // Else, if it's a "no results" item, toggle it in our local state.
    else if (itemResultsLength.value[itemId] === 0) {
      const currentState = noResultsOpenState.value[itemId] ?? false
      noResultsOpenState.value[itemId] = (typeof forceState === 'boolean') ? forceState : !currentState
    }
  }

  function handleDisplayCountUpdate(uniqueId: string, count: number) {
    itemDisplayCount.value[uniqueId] = count
  }

  /**
   * The core function to trigger fetching alternatives for a cart item.
   * @param itemId The uniqueIdName of the cart item.
   */
  async function fetchCartAlternatives(itemId: string) {
    if (fetchStatus.value !== 'IDLE' && fetchStatus.value !== 'SUCCESS' && fetchStatus.value !== 'ERROR') {
      console.warn(`[Fetch Alts] Already fetching for ${fetchUniqueId.value}. Cannot start fetch for ${itemId}.`)
      return
    }

    const cartItem = cartDataItems.value.find(item => item.uniqueIdName === itemId)
    if (!cartItem || !tabId.value) {
      _setErrorState('ITEM_NOT_FOUND', itemId)
      return
    }

    _setLoadingState(itemId)

    try {
      // Deep clone required for Firefox
      const rawCartItemData = JSON.parse(JSON.stringify(cartItem))
      const result = await sendMessage(
        START_CART_ITEM_ANALYSIS,
        { cartItemData: rawCartItemData, languageKey: languageKey.value ?? null },
        'background',
      )
      if (isStartAnalysisResponse(result)) {
        const response = result
        if (response.status === 'started') {
          _setFetchingState(response.jobId, response.sseToken, tabId.value)
        }
        else {
          _setErrorState('JOB_START_FAILED', itemId)
        }
      }
    }
    catch {
      _setErrorState('API_HANDLER_ERROR', itemId)
    }
  }

  /** Handles incoming SSE update messages */
  onMessage<SseUpdateMessage>(SSE_UPDATE, ({ data }) => {
    const { jobId, data: payload } = data
    if (activeJobId.value !== jobId)
      return // Ignore stale messages
    if (!fetchUniqueId.value)
      return // Not expecting messages

    const { message, step } = payload

    if (message === 'STATUS_SUCCESSFUL' || step === 100) {
      _setSuccessState(payload)
    }
    else if (message === 'STATUS_ERROR' || step === -99) {
      _setErrorState('SSE_PROCESSING_ERROR', fetchUniqueId.value)
    }
    else if (message) {
      sseKey.value = message // Just update the UI message
    }
  })

  /** Handles SSE connection errors */
  onMessage<{ jobId?: string, message: string }>(SSE_ERROR, ({ data }) => {
    if (activeJobId.value !== data.jobId)
      return
    _setErrorState('SSE_CONNECTION_ERROR', fetchUniqueId.value ?? undefined)
  })

  // --- Initialization ---
  cleanCartCache() // Run cache clean once on setup

  // --- Cleanup ---
  onUnmounted(() => {
    if (activeJobId.value) {
      sendMessage(STOP_SSE_LISTENING, { jobId: activeJobId.value }, 'background')
    }
  })

  // --- Return Values ---
  return {
    // --- State ---
    fetchStatus: readonly(fetchStatus),
    fetchUniqueId: readonly(fetchUniqueId),
    sseKey: readonly(sseKey),
    itemErrors: readonly(itemErrors),
    itemResultsLength: readonly(itemResultsLength),
    itemDisplayCount: readonly(itemDisplayCount),
    cartPageAltsCache,
    noResultsOpenState,
    // --- Methods ---
    fetchCartAlternatives,
    setIsOpen,
    handleDisplayCountUpdate,
  }
}
