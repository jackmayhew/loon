import { CS_READY, PING, PONG } from '~/constants/system/message-types'

/**
 * @name confirmCSReady
 * @description Reliably confirms if a content script is ready in a given tab.
 * It resolves the race condition between pinging a script that is already loaded
 * and waiting for a script that is still loading to announce itself.
 *
 * It simultaneously sends a 'PING' message and listens for a 'CS_READY' message.
 * Whichever event occurs first confirms the content script is alive.
 *
 * @param {number} tabId The ID of the tab to check.
 * @returns {Promise<boolean>} A promise that resolves to true if the script is ready, or false if it times out.
 */
export function confirmCSReady(tabId: number, signal: AbortSignal): Promise<boolean> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      return reject(new DOMException('Aborted', 'AbortError'))
    }

    let timeoutId: NodeJS.Timeout

    function handleAbort() {
      cleanup()
      reject(new DOMException('Aborted', 'AbortError'))
    }
    signal.addEventListener('abort', handleAbort)

    function cleanup() {
      clearTimeout(timeoutId)
      browser.runtime.onMessage.removeListener(onReadyMessage)
      // signal.removeEventListener('abort', handleAbort)
    }

    function onReadyMessage(
      message: any,
      _sender: any,
      _sendResponse: any,
    ): undefined {
      if (message.type === CS_READY && message.tabId === tabId) {
        cleanup()
        resolve(true)
      }
      return undefined
    }

    browser.runtime.onMessage.addListener(onReadyMessage)

    timeoutId = setTimeout(() => {
      cleanup()
      resolve(false)
    }, 10000)

    browser.tabs.sendMessage(tabId, { type: PING })
      .then((response: any) => {
        if (response?.reply === PONG) {
          cleanup()
          resolve(true)
        }
      })
      .catch(() => { /* Ping failed, which is expected if the CS is still loading. */ })
  })
}
