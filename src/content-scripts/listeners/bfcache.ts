/**
 * Detects when a page is restored from the browser's back-forward cache (bfcache).
 *
 * When a user navigates back to a page, it may be loaded from memory without
 * re-running the content script. This listener sends a message to the background
 * script, signaling it to re-evaluate the state of the now-active tab.
 */
import { CS_BFCACHE_RESTORE } from '~/constants/system/message-types'

window.addEventListener('pageshow', (event) => {
  if (event.persisted) {
    browser.runtime.sendMessage({
      type: CS_BFCACHE_RESTORE,
      payload: { url: window.location.href },
    })
  }
})
