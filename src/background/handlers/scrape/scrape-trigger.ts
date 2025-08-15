import { getActivePopupPort, getActiveTabId } from '~/background/handlers/popup/port-manager'
import { viewDataCached } from '~/logic/storage/index'
import { TRIGGER_SCRAPE } from '~/constants/system/message-types'
import { handleCacheUpdates } from '~/background/handlers/cache/cache'

/**
 * The single, authoritative function for triggering a content script scrape.
 *
 * This function acts as a centralized gatekeeper. It is called from multiple
 * places (e.g., after a navigation completes or when the popup opens) but
 * will only proceed if two critical conditions are met:
 *
 * 1. The popup must be open and active for the specific `tabId`.
 * 2. The tab's cached data must have a `scrapeStatus` of 'NEEDS_SCRAPE'.
 *
 * @param {number} tabId The ID of the tab to check and potentially scrape.
 */
export function triggerScrape(tabId: number) {
  const isPopupOpen = getActivePopupPort() && getActiveTabId() === tabId
  const state = viewDataCached.value?.[tabId]
  const needsScrape = state?.scrapeStatus === 'NEEDS_SCRAPE'

  if (isPopupOpen && needsScrape) {
    try {
      // Prevent re-triggering by updating status immediately
      handleCacheUpdates({ tabId, viewData: { domStatus: 'SCRAPING' } }, 'merge')
      browser.tabs.sendMessage(tabId, {
        type: TRIGGER_SCRAPE,
        data: {
          pageType: state.pageType,
          tabId,
          retailer: JSON.parse(JSON.stringify(state.retailer)),
        },
      })
    }
    catch (e) {
      console.error('ATTEMPT_SCRAPE: Failed to send message', e)
    }
  }
}
