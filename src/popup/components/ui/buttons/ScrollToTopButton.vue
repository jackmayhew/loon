<script setup lang="ts">
/**
 * A "Scroll to Top" button that appears when the user scrolls down a specified amount.
 * It's highly performant, using a throttled scroll listener, and can be attached to
 * either the main window or a specific scrollable DOM element. It also cleans up
 * its own event listeners automatically to prevent memory leaks.
 */
import { onBeforeUnmount, ref, watch } from 'vue'
import { ArrowUp } from 'lucide-vue-next'

const props = withDefaults(defineProps<{
  scrollContainerElement?: HTMLElement | null
}>(), {
  scrollContainerElement: null,
})

const isButtonVisible = ref(false)
const throttleDelay = 200
const scrollThreshold = 750
let throttleTimeout: ReturnType<typeof setTimeout> | null = null

function getResolvedScrollTarget(): HTMLElement | Window {
  return props.scrollContainerElement || window
}

function getScrollTop(): number {
  const target = getResolvedScrollTarget()
  if (target instanceof Window) {
    return target.scrollY || target.document.documentElement.scrollTop || target.document.body.scrollTop
  }
  else {
    return target.scrollTop
  }
}

function checkScrollPosition() {
  const currentScrollTop = getScrollTop()
  isButtonVisible.value = currentScrollTop > scrollThreshold
}

/**
 * Throttles the scroll event handler to prevent performance issues from
 * firing the checkScrollPosition function too frequently.
 */
function handleScroll() {
  if (throttleTimeout) {
    return
  }
  throttleTimeout = setTimeout(() => {
    checkScrollPosition()
    throttleTimeout = null
  }, throttleDelay)
}

function scrollToTopSmoothly() {
  getResolvedScrollTarget().scrollTo({
    top: 0,
    behavior: 'smooth',
  })
}

/**
 * Attaches the throttled scroll listener to the target element.
 * Uses a passive listener for better scroll performance.
 */
function setupScrollListener(target: HTMLElement | Window) {
  target.removeEventListener('scroll', handleScroll)
  target.addEventListener('scroll', handleScroll, { passive: true })
  checkScrollPosition()
}

/**
 * Removes the scroll listener and clears any pending throttle timeout
 * to prevent memory leaks.
 */
function cleanupScrollListener(target: HTMLElement | Window) {
  target.removeEventListener('scroll', handleScroll)
  if (throttleTimeout) {
    clearTimeout(throttleTimeout)
  }
}

/**
 * Ensures that all event listeners and pending timeouts are cleaned up
 * when the component is unmounted, preventing memory leaks.
 */
onBeforeUnmount(() => {
  cleanupScrollListener(getResolvedScrollTarget())
})

/**
 * Watches the `scrollContainerElement` prop for changes.
 * This is crucial for correctly adding and removing the scroll event listener.
 * If the scroll container changes (or is set for the first time), it cleans up
 * the old listener and attaches a new one to the correct target.
 *
 * - `immediate: true`: Runs the effect immediately on component mount.
 * - `flush: 'post'`: Ensures the DOM is updated before the effect runs,
 *   guaranteeing the `scrollContainerElement` exists when we try to attach a listener.
 */
watch(() => props.scrollContainerElement, (newSpecificElement, oldSpecificElement) => {
  const oldTarget = oldSpecificElement || window
  cleanupScrollListener(oldTarget)

  const newTarget = newSpecificElement || window
  setupScrollListener(newTarget)

  checkScrollPosition()
}, { immediate: true, flush: 'post' })
</script>

<template>
  <Transition name="scale-fade">
    <!-- BaseButton conflicts with transition -->
    <button
      v-if="isButtonVisible"
      :ariaLabel="$t('buttons.scrollToTop')"
      class="group fixed bottom-4 right-4 w-10 h-10 rounded-full flex items-center justify-center
      bg-zinc-800 button_primary_text shadow-xl"
      @click="scrollToTopSmoothly"
    >
      <BaseIcon
        :icon="ArrowUp"
        class="w-5 h-5 group-hover:-translate-y-0.25 transition-transform duration-150"
      />
    </button>
  </Transition>
</template>
