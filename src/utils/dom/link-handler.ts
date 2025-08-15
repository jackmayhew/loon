import browser from 'webextension-polyfill'

/**
 * The standard way to open a link from the extension popup.
 * It uses the browser.tabs.create API for robustness and then
 * closes the popup window.
 *
 * @param {string} url - The URL to open in a new tab.
 */
export function openLinkAndClosePopup(url: string) {
  // We don't await this because once the popup closes, our script might be terminated.
  // This sends the command and lets the browser handle it from there
  browser.tabs.create({ url })
  window.close()
}
