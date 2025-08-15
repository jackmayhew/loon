import { onMounted, onUnmounted } from 'vue'
import type { Ref } from 'vue'

/**
 * A Vue composable that closes a component when the 'Escape' key is pressed.
 * It safely adds and removes a global keydown event listener.
 *
 * @param {Ref<boolean>} isVisible - A reactive ref that controls the visibility of the target component.
 */
export function usePopoverEscape(isVisible: Ref<boolean>) {
  const handleKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && isVisible.value) {
      event.preventDefault()
      event.stopPropagation()
      isVisible.value = false
    }
  }

  onMounted(() => {
    window.addEventListener('keydown', handleKeydown)
  })

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeydown)
  })
}
