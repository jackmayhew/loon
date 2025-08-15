/**
 * Observes the DOM and returns a promise that resolves when the specified element appears.
 * Includes a timeout to prevent waiting indefinitely.
 *
 * @param {string} selector - The CSS selector for the element to wait for.
 * @returns {Promise<Element>} - A promise that resolves with the found element, or rejects on timeout.
 */
export function waitForElement(selector: string, timeout = 8000): Promise<Element> {
  return new Promise((resolve, reject) => {
    // 1. Check if the element already exists. If so, resolve immediately.
    const initialElement = document.querySelector(selector)
    if (initialElement) {
      resolve(initialElement)
      return
    }

    let observer: MutationObserver | null = null
    const timeoutId = setTimeout(() => {
      if (observer)
        observer.disconnect()
      reject(new Error(`waitForElement: Timed out after ${timeout}ms waiting for selector "${selector}"`))
    }, timeout)

    // 2. If it doesn't exist, set up an observer.
    observer = new MutationObserver((mutations, obs) => {
      const targetElement = document.querySelector(selector)
      if (targetElement) {
        clearTimeout(timeoutId)
        obs.disconnect() // Stop observing
        resolve(targetElement)
      }
    })

    // 3. Start observing the body for changes.
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
    })
  })
}
