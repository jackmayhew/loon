<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import ScrapedProductCardLoader from '~/popup/components/product-cards/loaders/ScrapedProductCardLoader.vue'

const props = defineProps<{
  loadingStatus?: string
}>()

const { tm, t } = useI18n()

const displayText = ref('')
const messageIndex = ref(0)

const MESSAGE_CYCLE_DELAY_MS = 750

let interval: NodeJS.Timeout | null = null

// TODO: Internationalization is not reactive within the message cycle.
// The array of messages is captured when the interval starts and does not
// update if the user changes the locale.
const scrapingMessages = computed(() => {
  const messages = tm('productPage.scrapingMessages')
  return Array.isArray(messages) ? messages : []
})

function startMessageCycle() {
  const messages = scrapingMessages.value
  if (messages.length === 0)
    return

  // Show first message immediately
  messageIndex.value = 0
  displayText.value = messages[0]

  // Cycle through messages every 4 seconds
  if (messages.length > 1) {
    interval = setInterval(() => {
      messageIndex.value = (messageIndex.value + 1) % messages.length
      displayText.value = messages[messageIndex.value]
    }, 4000)
  }
}

function stopMessageCycle() {
  if (interval) {
    clearInterval(interval)
    interval = null
  }
}

watch(() => props.loadingStatus, (status) => {
  stopMessageCycle()

  if (status === 'SCRAPING' || status === 'CHILD_LOADING') {
    // Wait 750ms before showing cycling messages to avoid flicker on quick operations
    setTimeout(() => {
      if (props.loadingStatus === 'SCRAPING' || props.loadingStatus === 'CHILD_LOADING') {
        startMessageCycle()
      }
    }, MESSAGE_CYCLE_DELAY_MS)
  }
  else {
    displayText.value = t('productPage.loadingMessage')
  }
}, { immediate: true })

// Initialize with default message
displayText.value = t('productPage.loadingMessage')

onUnmounted(() => {
  stopMessageCycle()
})
</script>

<template>
  <div class="loader_screen">
    <h4 class="section_heading mb-2">
      {{ displayText }}
    </h4>
    <ScrapedProductCardLoader />
  </div>
</template>
