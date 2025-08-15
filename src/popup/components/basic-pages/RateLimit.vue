<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { rateLimitState } from '~/logic/storage/index'
import loon from '~/assets/loon.webp'

const { t } = useI18n()

const countdown = ref(0)
let intervalId: ReturnType<typeof setInterval> | null = null

const formattedCountdown = computed(() => {
  if (countdown.value <= 0)
    return t('rateLimitPage.waitSeconds', 0)

  const minutes = Math.floor(countdown.value / 60)
  const seconds = countdown.value % 60

  if (minutes > 0 && seconds > 0) {
    const minutesText = t('rateLimitPage.minute', minutes)
    const secondsText = t('rateLimitPage.second', seconds)
    return t('rateLimitPage.waitBoth', { minutes: minutesText, seconds: secondsText })
  }
  if (minutes > 0)
    return t('rateLimitPage.waitMinutes', minutes)

  return t('rateLimitPage.waitSeconds', seconds)
})

// initialize countdown when component mounts
onMounted(() => {
  if (rateLimitState.value.expirationTimestamp) {
    // calculate remaining seconds from the expiration timestamp
    const remainingSeconds = Math.round(
      (rateLimitState.value.expirationTimestamp - Date.now()) / 1000,
    )

    countdown.value = Math.max(0, remainingSeconds)

    // start the visual countdown
    intervalId = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) {
        clearInterval(intervalId!)
        intervalId = null
      }
    }, 1000)
  }
})

// clean up interval when component unmounts
onUnmounted(() => {
  if (intervalId)
    clearInterval(intervalId)
})
</script>

<template>
  <div>
    <h3 class="section_heading mb-2">
      {{ $t('rateLimitPage.title') }}
    </h3>
    <div>
      <p class="section_subheading">
        {{ formattedCountdown }}.
      </p>
      <img class="w-42 absolute bottom-4 right-12 transform scale-x-[-1]" :src="loon" alt="loon">
    </div>
  </div>
</template>
