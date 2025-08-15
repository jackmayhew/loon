<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  isBookmarked: boolean
  strokeWidth?: string | number
}>()

const iconStrokeWidth = computed(() => props.strokeWidth || 2)

const CHECKMARK_DASH_LENGTH = 9
</script>

<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    :stroke-width="iconStrokeWidth"
    stroke-linecap="round"
    stroke-linejoin="round"
    class="bookmark-icon-base flex-shrink-0"
  >
    <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />

    <path
      class="checkmark-path"
      d="m9 10 2 2 4-4"
      :style="{
        strokeDasharray: CHECKMARK_DASH_LENGTH,
        strokeDashoffset: props.isBookmarked ? 0 : CHECKMARK_DASH_LENGTH,
      }"
    />
  </svg>
</template>

<style scoped>
.checkmark-path {
  transition: stroke-dashoffset 0.3s cubic-bezier(0.65, 0, 0.35, 1);
}
</style>
