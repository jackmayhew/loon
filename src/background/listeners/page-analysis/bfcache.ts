import browser from 'webextension-polyfill'
import { activeNavigations, navigationHandler } from '~/background/handlers/navigation/navigation'
import { CS_BFCACHE_RESTORE } from '~/constants/system/message-types'

/**
 * Handles browser forward/back cache (bfcache) restore events from content scripts.
 * When a page is restored from bfcache, re-runs analysis to ensure the extension
 * state is properly synchronized with the restored page.
 */
browser.runtime.onMessage.addListener((message: unknown, sender: browser.Runtime.MessageSender) => {
  const msg = message as any
  if (msg.type === CS_BFCACHE_RESTORE) {
    const tabId = sender.tab?.id
    const url = msg.payload?.url

    if (tabId && url) {
      activeNavigations.delete(tabId)
      navigationHandler({ tabId, url, frameId: 0 })
    }
    return true
  }
})
