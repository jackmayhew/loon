import axios from 'axios'
import { onMessage } from 'webext-bridge/background'
import { API_CALL } from '~/constants/system/message-types'
import { analyticsQueue, rateLimitState, serviceUnavailableState, userLanguage } from '~/logic/storage/index'
import { RATE_LIMIT_ALARM, SERVICE_UNAVAILABLE_ALARM } from '~/constants/system/alarm-names'
import { getUniqueUserId } from '~/utils/analytics/get-unique-user-id'
import { API_BASE_URL, API_ENDPOINTS } from '~/constants/api/api'
import type { AnalyticsEvent } from '~/types/analytics/analytics-event.types'

// AbortController for any active, cancellable request
const activeControllers = new Map<string, AbortController>()

interface ApiCallMessage {
  key?: string
  endpoint: string
  method: RequestInit['method']
  body?: any
  [key: string]: any
}

/**
 * The core function for making API requests. It checks local rate-limit and service
 * availability states, attaches required authentication headers, performs the actual
 * network call using axios, and handles various success and error responses. On success,
 * it also adds a usage tracking event to a queue for later batch processing.
 *
 * @todo Consider adding a "track: false" option to allow use for non-tracking requests.
 * @param endpoint The API endpoint to call (e.g., '/api/v1/analysis/analyze-product').
 * @param options The standard `RequestInit` options, including method, body, and signal.
 * @returns A normalized response object `{ ok, status, data }`.
 */
async function apiClient(endpoint: string, options: RequestInit) {
  // Rate limit
  if (rateLimitState.value.isLimited) {
    console.warn(`Request to ${endpoint} blocked due to active rate limit.`)
    return { ok: false, status: 429, data: { message: 'Rate limited' } }
  }

  // Service unavailable
  if (serviceUnavailableState.value.isUnavailable) {
    console.warn(`Request to ${endpoint} blocked due to service unavailable.`)
    return { ok: false, status: 503, data: { message: 'Service unavailable' } }
  }

  const uniqueUserId = getUniqueUserId()
  const corsOrigin = browser.runtime.id

  try {
    const response = await axios({
      url: `${API_BASE_URL}${endpoint}`,
      method: options.method,
      headers: {
        'Content-Type': 'application/json',
        'X-User-ID': uniqueUserId,
        'X-Extension-ID': corsOrigin,
      },
      data: options.body,
      signal: options.signal || undefined,
    })

    if (endpoint !== API_ENDPOINTS.ANALYTICS_USER && uniqueUserId) {
      const [activeTab] = await browser.tabs.query({ active: true, currentWindow: true })
      const hostname = activeTab?.url ? new URL(activeTab.url).hostname : 'unknown'

      const event: AnalyticsEvent = {
        userId: uniqueUserId,
        endpoint,
        hostname,
        userLanguage: userLanguage.value,
      }
      analyticsQueue.value = [...analyticsQueue.value, event]
    }

    return {
      ok: true,
      status: response.status,
      data: response.data,
    }
  }
  catch (error: any) {
    if (axios.isCancel(error)) {
      return { ok: false, status: 0, data: { message: 'Request aborted' } }
    }

    if (error && error.response) {
      // Rate limit
      if (error.response.status === 429) {
        console.warn('API rate limit hit! Setting rate limit flag.')
        const errorData = error.response.data
        const retryAfterMs = errorData.retryAfter || 60000
        const expirationTimestamp = Date.now() + retryAfterMs + 1000
        rateLimitState.value = { isLimited: true, expirationTimestamp }
        browser.alarms.create(RATE_LIMIT_ALARM, { delayInMinutes: (retryAfterMs / 60000) })
        return { ok: false, status: 429, data: errorData }
      }

      /**
       * Service Unavailable
       * @todo Make this retry delay configurable. Fetch it from a separate,
       * highly-available static endpoint (e.g., S3/Gist) to allow for
       * dynamic adjustment during a real outage.
       */
      if (error.response.status === 503) {
        const errorData = error.response.data
        const retryAfterMs = 600000
        const expirationTimestamp = Date.now() + retryAfterMs
        serviceUnavailableState.value = { isUnavailable: true, expirationTimestamp }
        browser.alarms.create(SERVICE_UNAVAILABLE_ALARM, { delayInMinutes: (retryAfterMs / 60000) })
        return { ok: false, status: 503, data: errorData }
      }

      console.error('API Client Error:', error.message)
      return { ok: false, status: error.response.status, data: error.response.data }
    }

    // Fallback for any other unexpected errors
    console.error('API Client Generic Error:', error)
    const message = error instanceof Error ? error.message : 'An unknown error occurred'
    return { ok: false, status: 500, data: { message } }
  }
}

/**
 * A high-level wrapper for `apiClient` that manages request cancellation.
 * If a request `key` is provided, it can abort a previous pending request with the same
 * key before initiating a new one. This is crucial for preventing race conditions
 * from rapid user interactions.
 * @param data The API call message, including the endpoint, method, body, and an optional cancellation key.
 * @returns The response from the `apiClient` function.
 */
export async function handleApiRequest(data: ApiCallMessage) {
  const { key, endpoint, method, body } = data

  const options: RequestInit = {
    method,
    ...(body && {
      headers: { 'Content-Type': 'application/json' },
      body,
    }),
  }

  if (key) {
    if (activeControllers.has(key))
      activeControllers.get(key)?.abort()

    const controller = new AbortController()
    activeControllers.set(key, controller)
    options.signal = controller.signal

    try {
      return await apiClient(endpoint, options)
    }
    finally {
      activeControllers.delete(key)
    }
  }

  return await apiClient(endpoint, options)
}

/**
 * Listens for `API_CALL` messages from the popup.
 * It acts as the single entry point for all API requests from popup,
 * forwarding the data payload to the `handleApiRequest` handler.
 */
export function initApiClientHandler() {
  onMessage<ApiCallMessage>(API_CALL, async ({ data }) => {
    // Receive the message from the popup and pass it to our core handler
    return await handleApiRequest(data)
  })
}
