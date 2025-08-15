<script setup lang="ts">
import loon from '~/assets/loon.webp'

const emit = defineEmits(['refresh'])

function triggerRefresh() {
  emit('refresh')
}
</script>

<template>
  <div>
    <h3 class="section_heading error_text mb-2">
      {{ $t('errorPage.title') }}
    </h3>
    <div>
      <p class="section_subheading">
        {{ $t('errorPage.message') }}
      </p>
      <RetryButton
        :text="$t('buttons.retry')"
        class="mt-2"
        @click="triggerRefresh"
      />
    </div>
    <img class="w-42 absolute bottom-4 right-12 transform scale-x-[-1]" :src="loon" alt="loon">
  </div>
</template>
