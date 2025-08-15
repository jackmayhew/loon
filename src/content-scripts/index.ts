import { createApp } from 'vue'
import App from './views/App.vue'
import { setupApp } from '~/logic/common-setup'
import '~/content-scripts/listeners/bfcache'
import { scrapeData } from '~/content-scripts/scrapers/scrapers'
import { CS_READY, GET_MY_TAB_ID, PING, PONG, TRIGGER_SCRAPE } from '~/constants/system/message-types'

// Firefox `browser.tabs.executeScript()` requires scripts return a primitive value
(async () => {
  // Handshake with bg script - entire CS awaits this
  async function getMyTabId(): Promise<{ tabId: number }> {
    return browser.runtime.sendMessage({ type: GET_MY_TAB_ID })
  }

  async function initializeCS() {
    try {
      const tabIdResponse = await getMyTabId()
      const myTabId = tabIdResponse.tabId
      // Handshake with confirmCSReady util (CS is loading late - ex: page refresh)
      browser.runtime.sendMessage({ type: CS_READY, tabId: myTabId })
    }
    catch (e) {
      /* If this handshake fails, the script will stop and the background
       * will eventually time out with a CS_NOT_READY error. This is slow but reliable.
       *
       * TODO: Implement a faster failure mechanism instead of relying on the slow timeout.
       *
       * The current timeout-based failure is reliable but slow (~10s). A direct
       * message would provide a much better user experience.
       *
       * Implementation Steps:
       * 1. Define a new message type constant, e.g., `CS_INIT_FAILED`.
       * 2. Send that message from this catch block: `browser.runtime.sendMessage({ type: CS_INIT_FAILED })`.
       * 3. In the background script, create a listener for `CS_INIT_FAILED`.
       * 4. This listener must find the correct AbortController for the tab from the
       *    `tabAnalysisControllers` map and call `.abort()` on it.
       * 5. This will cause the `confirmCSReady` promise in `runAnalysis` to reject
       *    instantly, providing immediate feedback to the user.
      */
      console.error('CRITICAL: Content script initialization failed. The script cannot function.', e)
    }
  }

  // Fire-and-forget initialization
  initializeCS()

  // Handshake with confirmCSReady (CS is already loaded)
  // TODO: Type this properly
  browser.runtime.onMessage.addListener((message: any, sender: any, sendResponse: any) => {
    if (message.type === PING) {
      sendResponse({ reply: PONG })
      return true
    }
    if (message.type === TRIGGER_SCRAPE) {
      scrapeData(message.data)
    }
  })

  // mount component to context window
  const container = document.createElement('div')
  container.id = __NAME__
  const root = document.createElement('div')
  const styleEl = document.createElement('link')
  const shadowDOM = container.attachShadow?.({ mode: __DEV__ ? 'open' : 'closed' }) || container
  styleEl.setAttribute('rel', 'stylesheet')
  styleEl.setAttribute('href', browser.runtime.getURL('dist/contentScripts/style.css'))
  shadowDOM.appendChild(styleEl)
  shadowDOM.appendChild(root)
  document.body.appendChild(container)
  const app = createApp(App)
  setupApp(app)
  app.mount(root)
})()
