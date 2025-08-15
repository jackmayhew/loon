import type { Runtime } from 'webextension-polyfill'
import { viewDataCached } from '~/logic/storage/index'
import { runAnalysis } from '~/background/handlers/navigation/navigation'
import { triggerScrape } from '~/background/handlers/scrape/scrape-trigger'

let activePopupPort: Runtime.Port | null = null
let activeTabId: number | null = null

/**
 * Pushes the latest view data for a specific tab to the open popup.
 * This function is the single point of contact for updating the UI.
 */
export function pushDataToPopup(tabId: number) {
  if (activePopupPort && activeTabId === tabId) {
    const data = viewDataCached.value[tabId]
    if (data) {
      // Deep clone required for Firefox
      activePopupPort.postMessage(JSON.parse(JSON.stringify(data)))
    }
  }
}

export const getActivePopupPort = () => activePopupPort
export const getActiveTabId = () => activeTabId

/**
 * Initializes the connection listener for the popup. This is the entry point
 * for the popup UI to communicate with the background script. It manages the
 * connection lifecycle and triggers analysis/scraping when needed.
 */
export function initPortManager() {
  browser.runtime.onConnect.addListener(async (port) => {
    if (!port.name.startsWith('popup-'))
      return

    const tabId = Number.parseInt(port.name.split('-')[1], 10)
    if (Number.isNaN(tabId))
      return

    let tab
    try {
      tab = await browser.tabs.get(tabId)
    }
    catch (e) {
      console.error(`BG: Could not get tab info for tabId: ${tabId}`, e)
      return
    }

    if (!tab.url)
      return

    activePopupPort = port
    activeTabId = tabId

    port.onDisconnect.addListener(() => {
      activePopupPort = null
      activeTabId = null
    })

    const existingData = viewDataCached.value[tabId]
    if (existingData)
      pushDataToPopup(tabId)

    // Decide if we need to re-run analysis
    const isStable = existingData?.domStatus === 'DOM_LOADED'
    const needsAnalysis = !isStable || existingData?.pageType === 'CART_PAGE' || !existingData

    if (needsAnalysis) {
      try {
        const controller = new AbortController()
        await runAnalysis(tabId, tab.url, controller.signal)
      }
      catch (error) {
        console.error(`BG: An error occurred during the analysis/scrape sequence for tab ${tabId}`, error)
      }
    }
    triggerScrape(tabId)
  })
}
