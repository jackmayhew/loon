/* eslint-disable no-console */
import { handleCacheUpdates } from '~/background/handlers/cache/cache'
import { allRetailerConfigs, viewDataCached } from '~/logic/storage/index'
import { confirmCSReady } from '~/utils/misc/confirm-cs-ready'
import { fetchAndCacheRetailerConfigs } from '~/background/handlers/retailers/retailers-handler'
import { stopAnalysisForTab } from '~/background/handlers/product-analysis/analysis'
import { triggerScrape } from '~/background/handlers/scrape/scrape-trigger'
import { analyzePageDetails, getPermissionStatus } from '~/background/handlers/analysis/page-analyzer'
import type { ViewData } from '~/types/view-data/view-data.types'

const tabAnalysisControllers: { [tabId: number]: AbortController } = {}
export const activeNavigations = new Map<number, string>()

/**
 * Analyzes a tab's current page to determine retailer support, page type, and scraping needs.
 * Handles the full flow: permission check → content script validation → page analysis → caching.
 * May trigger a scrape if the popup is open for this tab.
 *
 * @param {number} tabId - The ID of the tab to analyze.
 * @param {string} url - The URL of the page in the tab.
 * @param {AbortSignal} signal - Signal to cancel analysis during rapid navigations.
 */
export async function runAnalysis(tabId: number, url: string, signal: any) {
  try {
    // Step 1: Get configs
    let freshConfigs
    if (!allRetailerConfigs.value || allRetailerConfigs.value.length === 0)
      freshConfigs = await fetchAndCacheRetailerConfigs()
    const configsForDetection = freshConfigs || allRetailerConfigs.value

    // Step 2: Quick permission check first
    const urlObject = new URL(url)
    const hostname = urlObject.hostname
    const permission = getPermissionStatus(hostname, configsForDetection)

    // Step 3: Early return for unsupported sites
    if (permission !== 'supported_hostname') {
      const pageType = permission === 'unsupported' ? 'UNKNOWN_RETAILER_PAGE' : 'UNSUPPORTED_DOMAIN'
      const viewData: ViewData = { pageType, domStatus: 'DOM_LOADED', url }
      handleCacheUpdates({ tabId, viewData }, 'replace')
      return
    }

    // Step 4: Only check CS if we know the site is supported
    const csReady = await confirmCSReady(tabId, signal)
    signal.throwIfAborted()
    if (!csReady) {
      console.error(`BG: CS for tab ${tabId} not ready. Aborting analysis.`)
      const viewData: ViewData = { pageType: 'ERROR_PAGE', domStatus: 'ERROR', errorCode: 'CS_NOT_READY' }
      handleCacheUpdates({ tabId, viewData }, 'replace')
      return
    }

    // Step 5: Full analysis now that we know CS is ready
    const { pageType, retailer, isCaDomain } = await analyzePageDetails(url, tabId, configsForDetection)
    const needsScraping = pageType === 'PRODUCT_PAGE' || pageType === 'CART_PAGE'
    const currentCache = viewDataCached.value[tabId]

    const viewData: ViewData = {
      url,
      pageType,
      isCaDomain,
      domStatus: needsScraping ? 'DOM_LOADING' : 'DOM_LOADED',
      retailer,
      items: null,
      productData: null,
      scrapeStatus: needsScraping ? 'NEEDS_SCRAPE' : null,
      errorCode: null,
      isRefreshing: currentCache?.isRefreshing,
    }

    handleCacheUpdates({ tabId, viewData }, 'replace')
  }
  catch (error: any) {
    console.log('Analysis error', error)
    if (error.name === 'AbortError') {
      console.log(`BG: Analysis for tab ${tabId} was intentionally cancelled.`)
    }
    else {
      console.error(`BG: A critical error occurred during analysis for tab ${tabId}:`, error)
      const viewData: ViewData = { pageType: 'ERROR_PAGE', domStatus: 'ERROR', errorCode: 'ANALYSIS_FAILED' }
      handleCacheUpdates({ tabId, viewData }, 'replace')
    }
  }
}

/**
 * The main orchestrator for browser navigation events.
 * It filters out irrelevant navigations (e.g., iframes, internal browser pages),
 * manages cancellation logic for rapid navigations, and triggers page analysis.
 * Crucially, if the popup is already open for the target tab, this handler is also
 * responsible for triggering the scrape after analysis is complete.
 *
 * @param {object} details - The details object provided by the webNavigation event.
 * @param {number} details.tabId - The ID of the tab in which the navigation is occurring.
 * @param {string} details.url - The URL the tab is navigating to.
 * @param {number} details.frameId - The ID of the frame in which the navigation is occurring.
 */
export async function navigationHandler(details: { tabId: number, url: string, frameId: number }) {
  // Kill orphaned SSE connections
  stopAnalysisForTab(details.tabId)

  // Ignore navigations in sub-frames (e.g., iframes),
  if (details.frameId !== 0) {
    return
  }

  // One analysis job at a time
  if (activeNavigations.get(details.tabId) === details.url) {
    return
  }

  if (tabAnalysisControllers[details.tabId]) {
    tabAnalysisControllers[details.tabId].abort()
  }

  const controller = new AbortController()
  tabAnalysisControllers[details.tabId] = controller
  const { signal } = controller

  activeNavigations.set(details.tabId, details.url)

  try {
    if (signal.aborted)
      return
    await runAnalysis(details.tabId, details.url, signal)

    /**
     * Triggers a scrape if a navigation event completes while the popup is already open.
     * After analysis f inishes, this checks the shared state to see if the popup's port
     * is active for the current tab. This is the authoritative trigger for scrapes on
     * page refreshes or client-side navigations, working in tandem with the initial
     * scrape trigger located in the `onConnect` listener.
     */
    triggerScrape(details.tabId)
  }
  catch (error: any) {
    if (error.message !== 'AbortError')
      console.error(`navigationHandler for tab ${details.tabId} failed:`, error)
  }
  finally {
    if (tabAnalysisControllers[details.tabId] === controller)
      delete tabAnalysisControllers[details.tabId]
  }
  cleanupExpiredCache()
}

/**
 * Removes a tab from the active navigation lock.
 * This allows `navigationHandler` to re-process a URL after an explicit
 * request, such as from the popup's "go back" button.
 * @param {number} tabId The ID of the tab to unlock.
 */
export function clearActiveNavigation(tabId: number) {
  activeNavigations.delete(tabId)
}

/**
 * Performs garbage collection on the `viewDataCached` object.
 * It iterates through the cache and removes any entry that is not considered "fresh".
 * An entry is fresh only if it has a timestamp that is not older than the expiration threshold.
 * This prevents unbounded cache growth from tabs left open or closed.
 */
async function cleanupExpiredCache() {
  const now = Date.now()
  const EXPIRATION_MS = 60 * 60 * 1000 // 1 hour

  const currentCache = viewDataCached.value
  const keysToDelete: string[] = []

  for (const key in currentCache) {
    const entry = currentCache[key]

    // An entry is considered fresh ONLY if it has a timestamp
    // and that timestamp is NOT expired
    const isFresh = entry?.timestamp && (now - entry.timestamp <= EXPIRATION_MS)

    // If it's not fresh, mark it for deletion.
    if (!isFresh)
      keysToDelete.push(key)
  }

  if (keysToDelete.length > 0) {
    const updatedCache = { ...currentCache }
    keysToDelete.forEach(key => delete updatedCache[Number(key)])
    viewDataCached.value = updatedCache
  }
}

/**
 * Sets up all `webNavigation` event listeners.
 * This function gets called once when the background script starts.
 */
export function initNavigationListeners() {
  browser.webNavigation.onCommitted.addListener((details) => {
    // Ignore navigations in sub-frames (e.g., iframes)
    if (details.frameId !== 0) {
      return
    }

    // Ignore non-web pages (e.g., 'chrome://' or 'about:blank')
    if (!details.url?.startsWith('http')) {
      const viewData: ViewData = {
        url: details.url,
        domStatus: 'DOM_LOADED',
        pageType: 'NON_HTTP_PAGE',
        scrapeStatus: null,
        productData: null,
        items: null,
        errorCode: null,
        retailer: null,
        isRefreshing: false,
      }
      handleCacheUpdates({ tabId: details.tabId, viewData }, 'replace')
      return
    }

    const { tabId, url } = details

    const viewData: ViewData = {
      url,
      domStatus: 'NAVIGATING',
      pageType: null,
      scrapeStatus: null,
      productData: null,
      items: null,
      errorCode: null,
      retailer: null,
    }

    handleCacheUpdates({ tabId, viewData }, 'replace')

    clearActiveNavigation(details.tabId)
  })

  browser.webNavigation.onCompleted.addListener(navigationHandler)
  browser.webNavigation.onHistoryStateUpdated.addListener(navigationHandler)
}

browser.tabs.onRemoved.addListener((tabId) => {
  clearActiveNavigation(tabId)
})
