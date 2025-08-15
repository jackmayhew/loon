import { extractProductData } from '~/logic/scraper/product-scraper'
import { CACHE_COMPLETE_VIEW_DATA } from '~/constants/system/message-types'
import type { RetailerInfo } from '~/types/retailer/retailer.types'
import type { ViewData } from '~/types/view-data/view-data.types'

// Scrapes product data and sends message to the background cache
export async function scrapeAndReportProductData(tabId: number, retailer: RetailerInfo, signal: AbortSignal): Promise<void> {
  const result = await extractProductData(retailer, signal)
  if (signal.aborted)
    return
  const viewDataToCache: ViewData = {
    domStatus: 'DOM_LOADED',
    pageType: 'PRODUCT_PAGE',
    scrapeStatus: result.status === 'SUCCESS' ? 'SUCCESS' : 'ERROR',
    // Deep clone required for Firefox
    productData: result.status === 'SUCCESS' ? JSON.parse(JSON.stringify(result.data || null)) : null,
    errorCode: result.status === 'ERROR' ? result.errorCode : null,
  }
  browser.runtime.sendMessage({
    type: CACHE_COMPLETE_VIEW_DATA,
    data: { tabId, viewData: viewDataToCache, mode: 'merge' },
  })
}
