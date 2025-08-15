import { extractCartData } from '~/logic/scraper/cart-scraper'
import { CACHE_COMPLETE_VIEW_DATA } from '~/constants/system/message-types'
import type { RetailerInfo } from '~/types/retailer/retailer.types'
import type { ViewData } from '~/types/view-data/view-data.types'

// Scrapes cart data and sends message to the background cache
export async function scrapeAndReportCartData(tabId: number, retailer: RetailerInfo, signal: AbortSignal): Promise<void> {
  const result = await extractCartData(retailer, signal)
  if (signal.aborted)
    return
  const viewDataToCache: ViewData = {
    domStatus: 'DOM_LOADED',
    pageType: 'CART_PAGE',
    scrapeStatus: result.status === 'SUCCESS' ? 'SUCCESS' : 'ERROR',
    // Deep clone required for Firefox
    items: result.status === 'SUCCESS' ? JSON.parse(JSON.stringify(result.data.items || null)) : null,
    collapsedItems: result.status === 'SUCCESS' ? result.data.collapsedItems : false,
    errorCode: result.status === 'ERROR' ? result.errorCode : null,
  }
  browser.runtime.sendMessage({
    type: CACHE_COMPLETE_VIEW_DATA,
    data: { tabId, viewData: viewDataToCache, mode: 'merge' },
  })
}
