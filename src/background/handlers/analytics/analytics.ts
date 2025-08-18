import axios from 'axios'
import { onMessage } from 'webext-bridge/background'
import { getUniqueUserId } from '~/utils/analytics/get-unique-user-id'
import { TRACK_AMAZON_DOM_SCRAPE, TRACK_OUTBOUND_CLICK } from '~/constants/system/message-types'
import { API_BASE_URL, API_ENDPOINTS } from '~/constants/api/api'
import { analyticsQueue } from '~/logic/storage/index'

/**
 * Initializes the listener for tracking outbound clicks.
 * Uses a non-identifiable user ID to understand feature usage
 * without collecting personal data.
 */
export function handleAnalyticsOutboundClick() {
  onMessage(TRACK_OUTBOUND_CLICK, ({ data }) => {
    const { manufacturerName, retailerName, productUrl, clickOrigin, referringHostname, userLanguage } = data as any
    const corsOrigin = browser.runtime.id
    const uniqueUserId = getUniqueUserId()

    try {
      axios.post(
        `${API_BASE_URL}${API_ENDPOINTS.ANALYTICS_CLICK}`,
        {
          manufacturerName,
          retailerName,
          productUrl,
          clickOrigin,
          referringHostname,
          userLanguage,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-User-ID': uniqueUserId,
            'X-Extension-ID': corsOrigin,
          },
        },
      )
    }
    catch (err) {
      console.error('Failed to send outbound click analytics:', err)
    }
  })
}

/**
 * Sends the queued analytics events to the backend in a single batch.
 * This function is triggered by a repeating alarm. Failed batches are
 * discarded to prioritize extension stability over non-essential analytics.
 */
export function handleAnalyticsBatchAlarm() {
  const eventsToSend = analyticsQueue.value
  const corsOrigin = browser.runtime.id
  const uniqueUserId = getUniqueUserId()

  if (!eventsToSend || eventsToSend.length === 0)
    return

  // Immediately clear the queue to prevent sending events twice
  analyticsQueue.value = []

  try {
    axios.post(
      `${API_BASE_URL}${API_ENDPOINTS.ANALYTICS_USER}`,
      { events: eventsToSend },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': uniqueUserId,
          'X-Extension-ID': corsOrigin,
        },
      },
    )
  }
  catch (error) {
    console.error('Failed to send analytics batch:', error)
    // Batch failed. Discarding to prioritize extension stability over non-essential analytics
  }
}

/**
 * Initializes the listener for tracking successful Amazon DOM scrapes.
 * When a scrape on an Amazon page succeeds without needing the third-party API,
 * this handler is triggered to send a notification to the backend for analytics.
 * This helps measure cost savings and scraper effectiveness.
 */
export function handleAmazonDomScrapeSuccess() {
  onMessage(TRACK_AMAZON_DOM_SCRAPE, () => {
    const corsOrigin = browser.runtime.id
    const uniqueUserId = getUniqueUserId()

    try {
      axios.post(
        `${API_BASE_URL}${API_ENDPOINTS.ANALYTICS_AMAZON_DOM_SCRAPE}`,
        null,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-User-ID': uniqueUserId,
            'X-Extension-ID': corsOrigin,
          },
        },
      )
    }
    catch (error) {
      console.error('Failed to send analytics batch:', error)
    }
  })
}
