import { viewDataCached } from '~/logic/storage/index'
import { getActivePopupPort, getActiveTabId, pushDataToPopup } from '~/background/handlers/popup/port-manager'
import type { ViewData } from '~/types/view-data/view-data.types'

const loadingTimeouts: { [key: number]: NodeJS.Timeout } = {}

interface CacheUpdateData {
  tabId: number
  viewData: Partial<ViewData>
}

/* eslint-disable no-console */

/**
 * Handles incoming data updates for a specific tab's view state.
 * This is the central merging point for data from the popup and content scripts.
 * It also manages the lifecycle of scrape timeouts, starting a timer when a
 * scrape begins and clearing it upon completion or failure.
 *
 * @todo This function's internal logic is getting complex. Consider refactoring
 * the conditional state clearing (e.g., `isRefreshing`, `errorCode`)
 */
export function handleCacheUpdates(data: CacheUpdateData, mode: 'merge' | 'replace' = 'merge') {
  if (data && typeof data.tabId === 'number' && data.viewData) {
    const { tabId, viewData } = data
    const SCRAPE_TIMEOUT_MS = viewData.domStatus === 'SCRAPING' ? 20000 : 10000 // 20s - Rainforest API is slow
    const isPopupOpen = getActivePopupPort() && getActiveTabId() === tabId

    // --- Timeout Management ---
    if (loadingTimeouts[tabId]) {
      clearTimeout(loadingTimeouts[tabId])
      delete loadingTimeouts[tabId]
    }

    if (isPopupOpen && (viewData.domStatus === 'DOM_LOADING' || viewData.domStatus === 'SCRAPING')) {
      loadingTimeouts[tabId] = setTimeout(() => {
        console.error(`BG: Scrape for tab ${tabId} timed out. Dom status was: ${viewData.domStatus}, timeout was: ${SCRAPE_TIMEOUT_MS}`)
        const { url, retailer, pageType, domStatus } = viewDataCached.value[tabId] || {}

        // Differentiate between a scrape timeout (UI remains on product/cart page but shows an error)
        // and a general loading timeout (UI goes to a full error page).
        const errorPageType = pageType && domStatus === 'SCRAPING' ? pageType : 'ERROR'
        const errorDomStatus = domStatus === 'SCRAPING' ? 'DOM_LOADED' : 'ERROR'
        const errorScrapeStatus = domStatus === 'SCRAPING' ? 'ERROR' : null
        const errorCodeMsg = domStatus === 'SCRAPING' ? 'SCRAPE_TIMEOUT' : 'LOADING_TIMEOUT'

        const timeoutErrorState: ViewData = {
          url,
          retailer,
          pageType: errorPageType,
          domStatus: errorDomStatus,
          errorCode: errorCodeMsg,
          productData: null,
          items: null,
          isRefreshing: false,
          scrapeStatus: errorScrapeStatus,
        }
        viewDataCached.value[tabId] = timeoutErrorState
        try {
          browser.tabs.sendMessage(tabId, { type: 'ABORT_SCRAPE' })
        }
        catch {
          // Tab might be closed, ignore
        }
        pushDataToPopup(tabId)
      }, SCRAPE_TIMEOUT_MS)
    }

    // const existingData = viewDataCached.value[tabId] || {}
    const incomingUpdate = { ...viewData }

    // Always parse the retailer string if it exists
    if (incomingUpdate.retailer && typeof incomingUpdate.retailer === 'string') {
      try {
        incomingUpdate.retailer = JSON.parse(incomingUpdate.retailer)
      }
      catch (e) {
        console.error('BG: Failed to parse retailer string:', e)
        incomingUpdate.retailer = null
      }
    }

    let finalEntry

    if (mode === 'replace') {
      finalEntry = { ...incomingUpdate, timestamp: Date.now() }
    }
    else {
      const existingData = viewDataCached.value[tabId] || {}
      finalEntry = { ...existingData, ...incomingUpdate, timestamp: Date.now() }
    }

    // Clear refreshing state
    if (finalEntry.domStatus === 'DOM_LOADED' || finalEntry.domStatus === 'ERROR')
      finalEntry.isRefreshing = false

    // Clear errorCode if the new update doesn't explicitly provide one
    if (!('errorCode' in incomingUpdate))
      delete finalEntry.errorCode

    // Update the storage with the final object.
    viewDataCached.value = {
      ...viewDataCached.value,
      [tabId]: finalEntry as ViewData,
    }
    pushDataToPopup(data.tabId)
  }
  else if (data && typeof data.tabId === 'number') {
    const { [data.tabId]: _, ...rest } = viewDataCached.value
    viewDataCached.value = rest
    console.warn('BG: CACHE_COMPLETE_VIEW_DATA received invalid data, clearing cache for tab:', data.tabId)
  }
}

/**
 * Resets the cache for a specific tab to an initial "refreshing" state.
 * This overwrites the existing data to clear any stale information, but
 * crucially does NOT delete the cache entry. This prevents UI flicker by
 * ensuring a state object always exists for the active tab during a refresh.
 *
 * @param {number} tabId - The ID of the tab to reset.
 */
export function clearCacheForTab(tabId: number, mode: 'clear' | 'refresh' = 'clear') {
  const resetState: ViewData = {
    isRefreshing: mode === 'refresh',
    domStatus: 'NAVIGATING',
    pageType: null,
    items: null,
    productData: null,
    errorCode: null,
    url: viewDataCached.value[tabId]?.url,
  }

  viewDataCached.value = {
    ...viewDataCached.value,
    [tabId]: resetState,
  }

  pushDataToPopup(tabId)
}

/**
 * Clears the entire view data cache, effectively resetting the extension's
 * UI state for all tabs. This is intended for use in a "hard reset".
 *
 * @todo This function is ready but will be wired up once the Options page UI is built.
 * @param {string} reason - A reason for logging purposes.
 */
export function clearAllCache(reason: string) {
  console.log(`Clearing all view data caches. Reason: ${reason}`)
  // Cancel all pending timeouts
  for (const tabId in loadingTimeouts) {
    clearTimeout(loadingTimeouts[tabId])
    delete loadingTimeouts[tabId]
  }

  // Reset the main cache object
  viewDataCached.value = {}
}

/**
 * Cleans up the cache and any active scrape timeouts for a tab that has been closed.
 * This prevents memory leaks.
 */
browser.tabs.onRemoved.addListener((tabId) => {
  // --- Timeout Management ---
  if (loadingTimeouts[tabId]) {
    clearTimeout(loadingTimeouts[tabId])
    delete loadingTimeouts[tabId]
  }

  const { [tabId]: _, ...rest } = viewDataCached.value
  viewDataCached.value = rest
})
