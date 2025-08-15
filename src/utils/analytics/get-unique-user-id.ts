import { userId } from '~/logic/storage/index'

let sessionUserId: string | null = null

/**
 * Provides a consistent user ID for the current service worker session.
 * It handles the initial async loading of the persisted userId.
 * @returns {string} The unique user ID.
 */
export function getUniqueUserId(): string {
  // 1. If we have a consistent ID for this session, use it.
  if (sessionUserId)
    return sessionUserId

  // 2. If the persisted value has loaded, use it and set it for the session.
  if (userId.value) {
    sessionUserId = userId.value
    return sessionUserId
  }

  // 3. If we're here, it's the first call on a cold start.
  // Generate a new ID, set it for the session, and assign it to the store.
  const newId = crypto.randomUUID()
  sessionUserId = newId
  userId.value = newId // This will be persisted to storage asynchronously.
  return newId
}
