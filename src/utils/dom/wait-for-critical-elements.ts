import { waitForElement } from '~/utils/dom/wait-for-element'

/**
 * Waits for multiple critical elements to appear in the DOM.
 * It takes an array of CSS selectors and uses `Promise.all` to wait for all of them
 * concurrently, leveraging the `waitForElement` utility for each. The returned promise
 * will reject if *any* of the selectors are not found within the specified timeout.
 *
 * @note WIP - This utility is functional but has not yet been integrated into the
 * core application logic. It is intended for future use cases.
 *
 * @param {string[]} selectors - An array of CSS selectors for the critical elements.
 * @returns {Promise<Element[]>} - A promise that resolves with an array of the found elements, or rejects on timeout.
 */
export function waitForCriticalElements(selectors: string[], timeout = 8000): Promise<Element[]> {
  // 1. If the array is empty, there's nothing to wait for. Resolve immediately.
  if (!selectors || selectors.length === 0)
    return Promise.resolve([])

  // 2. Create an array of promises, one for each selector.
  // Each promise is a call to waitForElement, which will resolve when its
  // specific element is found or reject on its own timeout.
  const promises = selectors.map(selector => waitForElement(selector, timeout))

  // 3. Use Promise.all to wait for all of them to resolve.
  // If any single promise in the array rejects (e.g., times out),
  // Promise.all will immediately reject with the same reason.
  return Promise.all(promises)
}
