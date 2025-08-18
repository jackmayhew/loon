/**
 * Loon's background script entry point.
 *
 * This file's primary responsibility is to initialize all the separate,
 * modular parts of the extension. It imports the handlers and listeners
 * to activate them and sets up the initial event listeners for browser
 * installation and startup.
 */

// --- Listeners ---
import '~/background/listeners/main/messages'
import '~/background/listeners/alarms/alarms'
import '~/background/listeners/page-analysis/bfcache'
import '~/background/listeners/sse/sse'

// --- Initialize specific systems ---
import { initApiClientHandler } from '~/background/handlers/api-client/api-client'
import { handleAmazonDomScrapeSuccess, handleAnalyticsOutboundClick } from '~/background/handlers/analytics/analytics'
import { initNavigationListeners } from '~/background/handlers/navigation/navigation'
import { initProductPageHandler } from '~/background/handlers/product-page/product-page-handler'
import { initCartPageHandler } from '~/background/handlers/cart-page/cart-page-handler'
import { fetchAndCacheRetailerConfigs } from '~/background/handlers/retailers/retailers-handler'
import { initPortManager } from '~/background/handlers/popup/port-manager'

// --- Constants ---
import { ANALYTICS_BATCH_ALARM, DAILY_RETAILER_CONFIG_ALARM } from '~/constants/system/alarm-names'
import { APP_LINKS } from '~/constants/links/links'

/**
 * Runs on extension install or update to perform initial setup. This includes
 * opening a welcome page, fetching configs, and setting up core alarms.
 */
browser.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    browser.tabs.create({ url: APP_LINKS.WELCOME })
  }
  fetchAndCacheRetailerConfigs()
  browser.alarms.create(DAILY_RETAILER_CONFIG_ALARM, { periodInMinutes: 60 * 24 })
  browser.alarms.create(ANALYTICS_BATCH_ALARM, { periodInMinutes: 5 })
})

// Fetch retailers on browser startup
browser.runtime.onStartup.addListener(fetchAndCacheRetailerConfigs)

/**
 * Initialize all core event handlers.
 *
 * Note: The architectural choice here is for each handler module to be self-contained
 * and responsible for setting up its own listeners. This keeps related logic
 * (the handler) and its trigger (the listener) in the same file, promoting
 * modularity and avoiding a single, fragile listener file
 */
initNavigationListeners()
initPortManager()
initApiClientHandler()
initProductPageHandler()
initCartPageHandler()
handleAnalyticsOutboundClick()
handleAmazonDomScrapeSuccess()

// only in dev
if (import.meta.hot) {
  // @ts-expect-error for background HMR
  import('/@vite/client')
  import('./content-script-hmr') // load latest content script
}
