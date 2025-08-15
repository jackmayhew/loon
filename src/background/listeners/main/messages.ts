import {
  CACHE_COMPLETE_VIEW_DATA,
  GET_MY_TAB_ID,
  RESET_AND_ANALYZE_TAB,
  RETRY_TRIGGER_SCRAPE,
  TRIGGER_REFRESH,
} from '~/constants/system/message-types'
import { clearActiveNavigation, navigationHandler } from '~/background/handlers/navigation/navigation'
import { clearCacheForTab, handleCacheUpdates } from '~/background/handlers/cache/cache'
import { handleRefresh } from '~/background/handlers/refresh-popup/refresh'
import { triggerScrape } from '~/background/handlers/scrape/scrape-trigger'
import type { ViewData } from '~/types/view-data/view-data.types'

/**
 * Central handler for all browser.runtime.onMessage events. It routes incoming
 * messages to the appropriate logic based on their type.
 */
function messageHandler(message: any, sender: any, sendResponse: any) {
  switch (message.type) {
    // A one-time handshake from a content script to get its own tab ID.
    case GET_MY_TAB_ID:
      if (sender.tab?.id) {
        sendResponse({ tabId: sender.tab.id })
      }
      return true // Keep channel open for async response.

    // A data payload from a content script or popup to be merged into the cache.
    case CACHE_COMPLETE_VIEW_DATA:
      handleCacheUpdates(message.data, message.data.mode)
      break // Synchronous, no response needed.

    // A command to clear a tab's state and re-trigger analysis.
    case RESET_AND_ANALYZE_TAB: {
      const { tabId, url } = message.data
      clearCacheForTab(tabId)
      clearActiveNavigation(tabId)
      navigationHandler({ tabId, url, frameId: 0 })
      break // Synchronous, no response needed.
    }

    // Trigger a rescrape when a product or cart page scrape fails
    // Note: Was using RESET_AND_ANALYZE_TAB before. Prefer this targetted retry.
    case RETRY_TRIGGER_SCRAPE: {
      const { tabId, pageType } = message.data
      const viewDataToUpdate: ViewData = {
        scrapeStatus: 'NEEDS_SCRAPE',
        domStatus: 'SCRAPING',
        pageType,
        productData: null,
      }
      handleCacheUpdates({ tabId, viewData: viewDataToUpdate }, 'merge')
      triggerScrape(tabId)
      break // Synchronous, no response needed.
    }

    // A command from the popup to trigger a full refresh of its data.
    case TRIGGER_REFRESH:
      handleRefresh(message.data).then(sendResponse)
      return true // Keep channel open for async response.

    default:
      // For any unhandled message types, do nothing and let the channel close.
      break
  }
}

// Attach the single, central handler to the browser event.
// The `as any` cast is a pragmatic choice to handle the complex and
// inconsistent return type requirements (`void`, `boolean`, `Promise`) of this API.
browser.runtime.onMessage.addListener(messageHandler as any)
