import { useWebExtensionStorage } from '~/composables/use-web-extension-storage'
import type { LanguageKey } from '~/types/language/language.types'
import type { AnalyticsEvent } from '~/types/analytics/analytics-event.types'

export const userId = useWebExtensionStorage<string | null>('user_id', null)
export const rateLimitState = useWebExtensionStorage<{ isLimited: boolean, expirationTimestamp?: number }>('rate_limit_state', { isLimited: false })
export const userLanguage = useWebExtensionStorage<LanguageKey>('user_language', 'en')
export const serviceUnavailableState = useWebExtensionStorage<{ isUnavailable: boolean, expirationTimestamp?: number }>('service_unavailable_state', { isUnavailable: false })
export const analyticsQueue = useWebExtensionStorage<AnalyticsEvent[]>('analytics_queue', [])
