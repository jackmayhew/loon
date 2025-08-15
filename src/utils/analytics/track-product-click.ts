import { sendMessage } from 'webext-bridge/popup'
import { TRACK_OUTBOUND_CLICK } from '~/constants/system/message-types'
import { userLanguage, viewDataCached } from '~/logic/storage/index'

/**
 * Sends a message to the background script to track an outbound product click.
 * @param trackingData - The data for the product being clicked.
 * @param trackingData.manufacturerName - The name of the product's manufacturer.
 * @param trackingData.retailerName - The name of the retailer for the link.
 * @param trackingData.productUrl - The destination URL of the product link.
 * @param trackingData.clickOrigin - The UI component where the click occurred, like 'ProductView' or 'SearchResultsView'
 * @param activeTabId - The ID of the current active tab, injected in the component.
 */
export function trackProductClick(
  trackingData: {
    manufacturerName: string
    retailerName: string
    productUrl: string
    clickOrigin: string
  },
  activeTabId: number,
) {
  const currentTabData = viewDataCached.value[activeTabId]
  const referringHostname = currentTabData?.url
    ? new URL(currentTabData.url).hostname
    : 'unknown-referring-host'

  sendMessage(TRACK_OUTBOUND_CLICK, {
    manufacturerName: trackingData.manufacturerName,
    retailerName: trackingData.retailerName,
    productUrl: trackingData.productUrl,
    clickOrigin: trackingData.clickOrigin,
    referringHostname,
    userLanguage: userLanguage.value,
  }).catch(err => console.error('Failed to send product click message:', err))
}
