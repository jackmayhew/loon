import axios from 'axios'
import { onMessage } from 'webext-bridge/background'
import { getUniqueUserId } from '~/utils/analytics/get-unique-user-id'
import { TRACK_OUTBOUND_CLICK } from '~/constants/system/message-types'
import { API_BASE_URL, API_ENDPOINTS } from '~/constants/api/api'
import { analyticsQueue } from '~/logic/storage/index'

/**
 * Initializes the listener for tracking outbound clicks.
 * Uses a non-identifiable user ID to understand feature usage
 * without collecting personal data.
 */
export function initAnalyticsHandler() {
  onMessage(TRACK_OUTBOUND_CLICK, async ({ data }) => {
    const { manufacturerName, retailerName, productUrl, clickOrigin, referringHostname, userLanguage } = data as any
    const corsOrigin = browser.runtime.id
    const uniqueUserId = getUniqueUserId()

    try {
      await axios.post(
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
export async function handleAnalyticsBatchAlarm() {
  const eventsToSend = analyticsQueue.value

  if (!eventsToSend || eventsToSend.length === 0)
    return

  // Immediately clear the queue to prevent sending events twice
  analyticsQueue.value = []

  try {
    await axios.post(
      `${API_BASE_URL}${API_ENDPOINTS.ANALYTICS_USER}`,
      { events: eventsToSend },
      { headers: { 'Content-Type': 'application/json' } },
    )
  }
  catch (error) {
    console.error('Failed to send analytics batch:', error)
    // Batch failed. Discarding to prioritize extension stability over non-essential analytics
  }
}
