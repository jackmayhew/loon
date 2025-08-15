import { fetchAndCacheRetailerConfigs } from '~/background/handlers/retailers/retailers-handler'
import { handleAnalyticsBatchAlarm } from '~/background/handlers/analytics/analytics'
import { rateLimitState, serviceUnavailableState } from '~/logic/storage/index'
import { clearSearchCache } from '~/utils/cache/clear-search-cache'
import {
  ANALYTICS_BATCH_ALARM,
  DAILY_RETAILER_CONFIG_ALARM,
  RATE_LIMIT_ALARM,
  RETRY_CONFIG_FETCH_ALARM,
  SERVICE_UNAVAILABLE_ALARM,
} from '~/constants/system/alarm-names'

/**
 * Central listener for all browser.alarms events
 * - ANALYTICS_BATCH_ALARM: Periodically sends batched API usage analytics.
 * - DAILY_RETAILER_CONFIG_ALARM: Fires daily to refresh the cached retailer configurations.
 * - RETRY_CONFIG_FETCH_ALARM: Fires retailer fetch in case of error
 * - RATE_LIMIT_ALARM: Fires after an API rate limit period to re-enable API calls.
 * - SERVICE_UNAVAILABLE_ALARM: Fires on 503
 */
browser.alarms.onAlarm.addListener(async (alarm) => {
  // Useage analytics
  if (alarm.name === ANALYTICS_BATCH_ALARM) {
    handleAnalyticsBatchAlarm()
  }
  // Fetch retailers
  if (alarm.name === DAILY_RETAILER_CONFIG_ALARM) {
    fetchAndCacheRetailerConfigs()
    browser.alarms.clear(RETRY_CONFIG_FETCH_ALARM)
  }
  // Retry retailers fetch
  if (alarm.name === RETRY_CONFIG_FETCH_ALARM) {
    fetchAndCacheRetailerConfigs()
  }
  // Rate Limit
  if (alarm.name === RATE_LIMIT_ALARM) {
    rateLimitState.value = { isLimited: false, expirationTimestamp: 0 }
    clearSearchCache()
    browser.alarms.clear(RATE_LIMIT_ALARM)
  }
  // Service unavailable
  if (alarm.name === SERVICE_UNAVAILABLE_ALARM) {
    serviceUnavailableState.value = { isUnavailable: false, expirationTimestamp: 0 }
    clearSearchCache()
    browser.alarms.clear(SERVICE_UNAVAILABLE_ALARM)
  }
})
