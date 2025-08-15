import { clearAllCache, clearCacheForTab, handleCacheUpdates } from '~/background/handlers/cache/cache'
import { clearActiveNavigation, navigationHandler } from '~/background/handlers/navigation/navigation'
import { activeCustomView, allRetailerConfigs, rateLimitState } from '~/logic/storage/index'
import { fetchAndCacheRetailerConfigs } from '~/background/handlers/retailers/retailers-handler'
import type { ViewData } from '~/types/view-data/view-data.types'
import type { CustomViewType } from '~/types/view-data/custom-view.types'

interface SoftRefreshData {
  tabId: number
  storeActiveView?: CustomViewType
}

/**
 * Performs a "soft" refresh, resetting the state ONLY for the specified tab.
 * This is the safe default refresh action to be triggered from the main popup UI.
 * It clears the tab's cache and re-triggers the navigation analysis.
 * @param {SoftRefreshData} data - The necessary data, including the tabId to refresh.
 */
export async function handleRefresh(data: SoftRefreshData) {
  const { tabId, storeActiveView } = data
  const MIN_REFRESH_DURATION = 1000
  const refreshStart = Date.now()

  try {
    const tab = await browser.tabs.get(tabId)
    if (!tab.url)
      throw new Error(`Tab ${tabId} has no URL.`)

    // 1. Immediately update UI to show the refresh is in progress.
    handleCacheUpdates({ tabId, viewData: { isRefreshing: true, domStatus: 'DOM_LOADING' } }, 'merge')

    // 2. Clear out any old state for this specific tab.
    clearCacheForTab(tabId, 'refresh')
    clearActiveNavigation(tabId)
    rateLimitState.value = { isLimited: false }

    // 3. Restore a custom view (like bookmarks) if the user was on one.
    if (storeActiveView)
      activeCustomView.value = storeActiveView

    const elapsed = Date.now() - refreshStart
    const remainingDelay = Math.max(0, MIN_REFRESH_DURATION - elapsed)
    if (remainingDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, remainingDelay))
    }

    // 4. Re-run the analysis for the tab's current URL.
    await navigationHandler({ tabId, url: tab.url, frameId: 0 })

    return { success: true }
  }
  catch (error) {
    // TODO: Handle ui feedback when no tabId (can't use handleCacheUpdates)
    await new Promise(resolve => setTimeout(resolve, 1000)) // Ensure ui gets feedback. Pretty jank
    // If anything fails, put the UI into a clear error state.
    const viewData: ViewData = { pageType: 'ERROR_PAGE', domStatus: 'ERROR', errorCode: 'REFRESH_ERROR' }
    handleCacheUpdates({ tabId, viewData }, 'replace')
    console.error(`Background soft refresh failed for tab ${tabId}:`, error)
    return { success: false }
  }
}

/**
 * Performs a "hard" reset, wiping all global cached data for the entire extension.
 * This is a powerful recovery tool intended to be triggered from an options page.
 * It clears all retailer configs, active navigation state,
 * then re-fetches the essential retailer configurations.
 *
 * @todo This function is ready but will be wired up once the Options page UI is built,
 * and add the MIN_REFRESH_DURATION logic found in handleRefresh
 *
 */
export async function handleHardReset() {
  try {
    // 1. Clear all global and tab-specific caches.
    clearAllCache('hard-reset')

    // 2. Reset global state values.
    allRetailerConfigs.value = null

    // 3. Re-fetch essential startup data.
    await fetchAndCacheRetailerConfigs()

    return { success: true }
  }
  catch (error) {
    console.error('The hard reset process failed critically:', error)
    // In a hard reset, if this fails, the extension is in a bad state.
    // The user may need to reinstall or restart the browser.
    return { success: false, error: 'Critical reset failure' }
  }
}
