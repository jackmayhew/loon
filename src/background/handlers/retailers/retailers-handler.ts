import { handleApiRequest } from '~/background/handlers/api-client/api-client'
import { allRetailerConfigs } from '~/logic/storage/index'
import { RETRY_CONFIG_FETCH_ALARM } from '~/constants/system/alarm-names'
import { API_ENDPOINTS } from '~/constants/api/api'

/**
 * Fetches the complete list of active retailer configurations from the backend API and
 * caches them into the `allRetailerConfigs` reactive storage.
 *
 * This function includes a robust retry mechanism. On a successful fetch, it updates the
 * cache and clears any pending retry alarms. If the fetch fails for any reason (network
 * or API error), it creates a browser alarm to automatically retry the operation after
 * a set delay.
 *
 * It re-throws errors so that synchronous callers (e.g., a manual refresh from the popup)
 * are notified of the failure and can react accordingly.
 *
 * @async
 * @throws {Error} Re-throws the underlying fetch or API error to the caller.
 */
export async function fetchAndCacheRetailerConfigs() {
  try {
    const response = await handleApiRequest({
      key: 'get-all-retailers',
      endpoint: API_ENDPOINTS.GET_ALL_RETAILERS,
      method: 'GET',
    })
    if (response.ok && response.data?.retailers) {
      // The backend manually stringifies the data payload, so we have to parse it here
      const retailersArray = JSON.parse(response.data.retailers)
      allRetailerConfigs.value = retailersArray
      browser.alarms.clear(RETRY_CONFIG_FETCH_ALARM)
      return retailersArray
    }
    else {
      browser.alarms.clear(RETRY_CONFIG_FETCH_ALARM)
      browser.alarms.create(RETRY_CONFIG_FETCH_ALARM, { delayInMinutes: 15 })
      console.error('Failed to fetch retailer configs:', response.data?.message || response.status)
      throw new Error('retailer fetch')
    }
  }
  catch (error) {
    console.error('Error fetching retailer configs, scheduling retry:', error)
    browser.alarms.clear(RETRY_CONFIG_FETCH_ALARM)
    browser.alarms.create(RETRY_CONFIG_FETCH_ALARM, { delayInMinutes: 15 })
    // Re-throw so caller knows it failed.
    throw error
  }
}
