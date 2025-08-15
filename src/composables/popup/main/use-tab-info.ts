import { ref } from 'vue'
import type { Ref } from 'vue'
import browser from 'webextension-polyfill'

/**
 * Get info about the current browser tab (URL, ID, domain).
 *
 * This composable automatically grabs the active tab's info
 * and keeps it updated.
 *
 * @returns {object} { currentUrl, currentTabId, currentHostname, isLoadingTabInfo }
 */
export function useTabInfo() {
  const currentUrl: Ref<string | null> = ref(null)
  const currentTabId: Ref<number | null> = ref(null)
  const currentHostname: Ref<string | null> = ref(null)
  const isLoadingTabInfo: Ref<boolean> = ref(true)

  function resetState() {
    currentUrl.value = null
    currentTabId.value = null
    currentHostname.value = null
  }

  async function fetchTabInfo() {
    resetState()
    isLoadingTabInfo.value = true

    try {
      if (!browser.tabs) {
        console.error('useTabInfo: browser.tabs API not available.')
        return
      }

      const tabs = await browser.tabs.query({ active: true, currentWindow: true })
      const tab = tabs[0]

      if (tab && tab.url) {
        currentUrl.value = tab.url
        currentTabId.value = tab.id ?? null

        try {
          const urlObject = new URL(tab.url)
          currentHostname.value = urlObject.hostname
        }
        catch {
          console.warn('useTabInfo: Could not extract hostname from invalid URL:', tab.url)
          currentHostname.value = null
        }
      }
      else {
        console.warn('useTabInfo: No active tab with a URL was found.')
      }
    }
    catch (error) {
      console.error('useTabInfo: Error fetching tab info:', error)
    }
    finally {
      isLoadingTabInfo.value = false
    }
  }

  if (typeof window !== 'undefined') {
    fetchTabInfo()
  }

  return {
    currentUrl,
    currentTabId,
    currentHostname,
    isLoadingTabInfo,
  }
}
