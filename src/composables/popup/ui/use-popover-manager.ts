import { readonly, ref } from 'vue'

/**
 * Composable factory to manage a set of mutually exclusive popovers.
 * Each call to this function creates a new, independent state.
 */
export function usePopoverManager() {
  const activePopoverId = ref<string | null>(null)

  function open(id: string) {
    activePopoverId.value = id
  }

  function close() {
    activePopoverId.value = null
  }

  /**
   * Toggles the state of a popover. This is an atomic operation
   * that prevents race conditions between multiple components.
   * @param id - The unique identifier of the popover to toggle.
   */
  function toggle(id: string) {
    activePopoverId.value = activePopoverId.value === id ? null : id
  }

  return {
    activePopoverId: readonly(activePopoverId),
    open,
    close,
    toggle,
  }
}
