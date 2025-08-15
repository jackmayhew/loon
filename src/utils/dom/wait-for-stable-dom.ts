// Keep track of the state of the *current* wait operation.
let activeObserver: MutationObserver | null = null
let debounceTimer: NodeJS.Timeout | null = null
let hardTimeout: NodeJS.Timeout | null = null

/**
 * Returns a promise that resolves when the DOM is "stable".
 * Stability is defined as a period of no mutations.
 * Calling this function will cancel any previously active wait.
 *
 * @returns {Promise<void>} A promise that resolves when the DOM is stable or max wait time is reached.
 */
export function triggerDOMStableCheck(): Promise<void> {
  // 1. Clean up any previous, unfinished wait operation.
  if (activeObserver)
    activeObserver.disconnect()
  if (debounceTimer)
    clearTimeout(debounceTimer)
  if (hardTimeout)
    clearTimeout(hardTimeout)

  // 2. Return a new promise that encapsulates the entire waiting logic.
  return new Promise((resolve) => {
    const STABLE_DELAY_MS = 2000
    const MAX_WAIT_MS = 8000

    // The single function to call when the wait is over, for any reason.
    const onFinish = () => {
      if (activeObserver)
        activeObserver.disconnect()

      // The hard timeout might still be pending if we finished via the debounce timer.
      if (hardTimeout)
        clearTimeout(hardTimeout)

      resolve()
    }

    // 3. Set up the new observer.
    activeObserver = new MutationObserver(() => {
      // On any mutation, reset the debounce timer.
      if (debounceTimer)
        clearTimeout(debounceTimer)
      debounceTimer = setTimeout(onFinish, STABLE_DELAY_MS)
    })

    // 4. Start observing and set the timers.
    activeObserver.observe(document.body, {
      attributes: true,
      childList: true,
      subtree: true,
    })

    // This timer ensures the promise resolves even if mutations never stop.
    hardTimeout = setTimeout(onFinish, MAX_WAIT_MS)

    // This timer handles the case where the DOM is *already* stable when called.
    debounceTimer = setTimeout(onFinish, STABLE_DELAY_MS)
  })
}
