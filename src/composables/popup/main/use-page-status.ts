/**
 * The popup's main state machine.
 *
 * Connects to the background script to get live `viewData` for the active tab.
 * It then computes all the derived state needed to render the correct view, like
 * `pageType`, `loadingStatus`, and `isErrorState`. Also provides methods for the
 * UI to trigger actions (refresh, retry, change view).
 *
 * NOTE: This composable is doing **a lot**. As the app grows,
 * it will be refactored into smaller, more focused composables
 * (e.g., a dedicated `useBackgroundConnection`)
 */
import { computed, onMounted } from 'vue'
import { watchOnce } from '@vueuse/core'
import type { Ref } from 'vue'
import type { Runtime } from 'webextension-polyfill'
import { rateLimitState, serviceUnavailableState, viewDataCached } from '~/logic/storage/index'
import { CUSTOM_VIEW_TYPES_SET } from '~/constants/view-data/custom-view-types'
import { CACHE_COMPLETE_VIEW_DATA, RESET_AND_ANALYZE_TAB, RETRY_TRIGGER_SCRAPE, TRIGGER_REFRESH } from '~/constants/system/message-types'
import type { PageType } from '~/types/view-data/page-type.types'
import type { CustomViewType } from '~/types/view-data/custom-view.types'
import type { LoadingStatus } from '~/types/view-data/loading-status.types'
import type { DomStatus } from '~/types/view-data/dom-status.types'
import type { ViewData } from '~/types/view-data/view-data.types'

export function usePageStatus(
  tabId: Ref<number | null>,
  currentHostname: Ref<string | null>,
  // currentUrl: Ref<string | null>,
) {
  const viewData = ref<ViewData | null>(null)
  const activeUrl = computed(() => viewData.value?.url)
  const popupIsRefreshingFlag = ref<boolean>(false) // Local lock
  const popupIsRefreshing = computed(() => viewData.value?.isRefreshing ?? false) // True refresh status from background
  const isCustomViewActive = computed(() => {
    if (!viewData.value?.pageType)
      return false
    return CUSTOM_VIEW_TYPES_SET.has(viewData.value.pageType as CustomViewType)
  })
  let port: Runtime.Port | null = null

  /**
   * Sets viewData to an error state with the specified error code and page type.
   */
  function setErrorState(errorCode: string, pageType: PageType = 'ERROR_PAGE') {
    viewData.value = {
      pageType,
      domStatus: 'ERROR',
      errorCode,
    }
  }

  /**
   * Establishes and manages the long-lived port connection to the background script.
   * Crucially, it waits for the `tabId` to be resolved via `watchOnce` before connecting.
   * This ensures the background script receives the correct `tabId` embedded in the port's name.
   * The `onMessage` listener acts as a one-way data receiver, populating the local `viewData`
   * ref with the latest state pushed from the background. The port is cleanly disconnected
   * on component unmount to prevent memory leaks
   */
  onMounted(() => {
    watchOnce(tabId, (newTabId) => {
      if (!newTabId)
        return

      const initialData = viewDataCached.value?.[newTabId]
      if (initialData) {
        viewData.value = initialData
      }

      try {
        const activePort = browser.runtime.connect({ name: `popup-${newTabId}` })
        port = activePort

        activePort.onMessage.addListener((message: unknown) => {
          viewData.value = message as ViewData
        })
      }
      catch (error) {
        console.error('usePageStatus: Port connection failed.', error)
        setErrorState('PORT_CONNECTION_FAILED')
      }
    })
  })

  onUnmounted(() => {
    port?.disconnect()
  })

  const pageType = computed<PageType | null>(() => {
    if (rateLimitState.value.isLimited)
      return 'RATE_LIMITED_PAGE'

    if (serviceUnavailableState.value.isUnavailable)
      return 'SERVICE_UNAVAILABLE_PAGE'

    if (viewData.value?.pageType)
      return viewData.value.pageType

    if (!currentHostname.value)
      return null

    return null
  })

  const domStatus = computed<DomStatus>(() => {
    if (isCustomViewActive.value)
      return 'DOM_LOADED'

    // Ignore non-web pages (e.g., 'chrome://' or 'about:blank')
    if (pageType.value === 'NON_HTTP_PAGE')
      return 'DOM_LOADED' // todo: new domStatus type?

    return viewData.value?.domStatus || 'WAITING'
  })

  const loadingStatus = computed<LoadingStatus>(() => {
    if (popupIsRefreshing.value)
      return 'CHILD_LOADING'
    if (domStatus.value === 'DOM_LOADING')
      return 'CHILD_LOADING'
    if (domStatus.value === 'NAVIGATING' || domStatus.value === 'SCRAPING')
      return 'CHILD_LOADING' // 'POPUP_LOADING' ?
    return 'COMPLETE'
  })

  // Nagivation to custom view (bookmarks, search results)
  async function changeView(newPageType: PageType) {
    if (!CUSTOM_VIEW_TYPES_SET.has(newPageType as CustomViewType))
      return

    if (!tabId.value) {
      console.error('Missing tabId')
      setErrorState('MISSING_TAB_ID')
      return
    }

    // Optomistic update. Doesn't seem to be needed
    // viewData.value = { pageType: newPageType, domStatus: 'DOM_LOADED' }

    const viewDataToCache = { pageType: newPageType }

    try {
      await browser.runtime.sendMessage({
        type: CACHE_COMPLETE_VIEW_DATA,
        data: {
          tabId: tabId.value,
          viewData: viewDataToCache,
          mode: 'merge',
        },
      })
    }
    catch (error) {
      console.error('Failed to cache custom view change:', error)
      setErrorState('VIEW_CHANGE_FAILED')
    }
  }

  // 'Go back' button while on custom view
  async function goBackToPreviousView() {
    if (!tabId.value) {
      console.error('Missing tabId')
      setErrorState('MISSING_TAB_ID')
      return
    }

    try {
      await browser.runtime.sendMessage({
        type: RESET_AND_ANALYZE_TAB,
        data: { tabId: tabId.value, url: activeUrl.value },
      })
    }
    catch (error) {
      // Message failed, set error in ui
      console.error('Failed to reset and analyze tab:', error)
      setErrorState('NAVIGATION_FAILED')
    }
  }

  // Refresh popup
  async function handleRefresh() {
    if (popupIsRefreshingFlag.value) // Lock the refresh button
      return
    popupIsRefreshingFlag.value = true
    try {
      await browser.runtime.sendMessage({
        type: TRIGGER_REFRESH,
        data: {
          tabId: tabId.value,
          pageType: viewData.value?.pageType,
        },
      })
    }
    catch (error) {
      // Message failed, set error in ui
      console.error('REFRESH_FAILED:', error)
      setErrorState('REFRESH_FAILED')
    }
    finally {
      popupIsRefreshingFlag.value = false
    }
  }

  // Retry product/cart page scrape
  async function retryScrape() {
    if (!tabId.value || !activeUrl.value || !viewDataCached.value?.[tabId.value]) {
      setErrorState('SCRAPE_RETRY_FAILED')
      return
    }
    try {
      await browser.runtime.sendMessage({ type: RETRY_TRIGGER_SCRAPE, data: { tabId: tabId.value, pageType: pageType.value } })
    }
    catch (error) {
      console.error('SCRAPE_FAILED:', error)
      setErrorState('SCRAPE_FAILED')
    }
  }

  // Determine error state
  const isErrorState = computed(() => {
    if (viewData.value?.domStatus === 'ERROR')
      return true
    if (!viewData.value?.pageType)
      return false // can't be an error page type if it's null

    const errorPageTypes = new Set(['ERROR_PAGE', 'RETAILER_ERROR_PAGE', 'URL_ERROR_PAGE', 'ERROR'])
    return errorPageTypes.has(viewData.value?.pageType)
  })

  return {
    domStatus,
    pageType,
    loadingStatus,
    isErrorState,
    popupIsRefreshing,
    activeUrl,
    viewData,
    // --- Methods ---
    handleRefresh, // Refresh button in header
    retryScrape, // Retry failed scrape
    goBackToPreviousView, // 'Back' button on custom views (bookmarks, search results)
    changeView, // Navigate to custom views (bookmarks, search results)
  }
}
