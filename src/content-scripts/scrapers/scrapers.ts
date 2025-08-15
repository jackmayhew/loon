import { scrapeAndReportProductData } from '~/content-scripts/scrapers/product-page/product-scraper'
import { scrapeAndReportCartData } from '~/content-scripts/scrapers/cart-page/cart-scraper'
import { triggerDOMStableCheck } from '~/utils/dom/wait-for-stable-dom'
import { waitForElement } from '~/utils/dom/wait-for-element'
import { getRetailerConfig } from '~/logic/config/get-retailer-config'
import { CACHE_COMPLETE_VIEW_DATA } from '~/constants/system/message-types'
import type { ViewData } from '~/types/view-data/view-data.types'
import type { ScrapeTriggerData } from '~/types/scraper/trigger-scrape'

// No need for a map, as CS doesn't share state across tabs
let isScraping = false

let scrapeController: AbortController | null = null

browser.runtime.onMessage.addListener((message: any) => {
  if (message.type === 'ABORT_SCRAPE') {
    scrapeController?.abort()
    return undefined
  }
})

export async function scrapeData(data: ScrapeTriggerData) {
  const { pageType, tabId, retailer } = data

  if (isScraping)
    return

  isScraping = true

  const configResult = getRetailerConfig(retailer)
  const primaryWaitSelector = configResult?.config.productPage?.dom?.primaryWaitSelector
  const productContainer = configResult?.config.productPage?.dom?.container
  const cartContainer = configResult?.config.cartPage?.dom?.container

  try {
  /**
   * NOTE: CURRENTLY DEFAULTING TO triggerDOMStableCheck FOR ALL CASES OTHER THAN AMAZON PRODUCT PAGE.
   * waitForElement was too brittle. Need a better approach
   *
   * Implements a flexible wait strategy before initiating a scrape on a product page.
   * This ensures the page's critical content is loaded, improving scrape reliability.
   *
   * It uses a special-cased optimization for Amazon: it waits only for a single,
   * critical element (the ASIN input) and then proceeds immediately.
   *
   * For all other retailers, it employs a robust two-step hybrid approach:
   * 1. Wait for the main product container element to appear.
   * 2. Run `triggerDOMStableCheck` to ensure dynamic content within that container has loaded.
   */

    // --- WAIT FOR DOM TO BEGIN SCRAPING ---
    if (pageType === 'PRODUCT_PAGE' && productContainer) {
      // Special-cased optimization for Amazon. As the most critical retailer, it gets a
      // dedicated, faster wait strategy that targets a single, reliable element
      if (configResult && configResult.retailerName === 'amazon' && primaryWaitSelector) {
        await waitForElement(primaryWaitSelector)
      }
      else {
        await triggerDOMStableCheck()
      }
    }
    else if (pageType === 'CART_PAGE' && cartContainer) {
      await triggerDOMStableCheck()
    }
    else {
      await triggerDOMStableCheck()
    }

    // --- BEGIN SCRAPING ---
    scrapeController = new AbortController()
    if (pageType === 'PRODUCT_PAGE') {
      await scrapeAndReportProductData(tabId, retailer, scrapeController.signal)
    }
    else if (pageType === 'CART_PAGE') {
      await scrapeAndReportCartData(tabId, retailer, scrapeController.signal)
    }
  }
  catch (error: any) {
    if (!error?.message?.includes('aborted')) {
      console.error(`CS: Bridge scrape failed for ${data.pageType}`, error)
    }
    const viewDataToCache: ViewData = {
      domStatus: 'DOM_LOADED',
      pageType,
      scrapeStatus: 'ERROR',
      productData: null,
      items: null,
      errorCode: 'UNKNOWN_ERROR',
    }
    browser.runtime.sendMessage({
      type: CACHE_COMPLETE_VIEW_DATA,
      // TODO: merge or replace?
      data: { tabId, viewData: viewDataToCache, mode: 'replace' },
    })
  }
  finally {
    isScraping = false
  }
}
