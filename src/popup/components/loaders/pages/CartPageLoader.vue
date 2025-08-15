<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import ScrapedProductCardLoader from '~/popup/components/product-cards/loaders/ScrapedProductCardLoader.vue'

const { tm, t } = useI18n()

const MESSAGE_CYCLE_DELAY_MS = 500

const displayText = ref('')
const messageIndex = ref(0)
let interval: NodeJS.Timeout | null = null

// TODO: Internationalization is not reactive within the message cycle.
// The array of messages is captured when the interval starts and does not
// update if the user changes the locale.
const scrapingMessages = computed(() => {
  const messages = tm('cartPage.scrapingMessages')
  return Array.isArray(messages) ? messages : []
})

function startMessageCycle() {
  const messages = scrapingMessages.value
  if (messages.length === 0) {
    // If no specific messages, just show the default and stop.
    displayText.value = t('cartPage.loadingMessage')
    return
  }

  // Show first message immediately
  messageIndex.value = 0
  displayText.value = messages[0]

  // Cycle through remaining messages
  if (messages.length > 1) {
    interval = setInterval(() => {
      messageIndex.value = (messageIndex.value + 1) % messages.length
      displayText.value = messages[messageIndex.value]
    }, 4000) // 4-second cycle
  }
}

function stopMessageCycle() {
  if (interval) {
    clearInterval(interval)
    interval = null
  }
}

// Unlike the product page, this loader is always in a "scraping" state
const delayTimer = setTimeout(() => {
  startMessageCycle()
}, MESSAGE_CYCLE_DELAY_MS)

// Initial text before the cycle starts
displayText.value = t('cartPage.loadingMessage')

onUnmounted(() => {
  stopMessageCycle()
  clearTimeout(delayTimer)
})
</script>

<template>
  <div class="loader_screen">
    <h4 class="section_heading mb-2">
      {{ displayText }}
    </h4>
    <template v-for="n in 3" :key="n">
      <ScrapedProductCardLoader class="mb-4" />
    </template>
  </div>
</template>
