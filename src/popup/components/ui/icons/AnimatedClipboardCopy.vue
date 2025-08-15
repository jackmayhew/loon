<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  copied: boolean
  size?: string | number
  strokeWidth?: string | number
}>()

const iconSize = computed(() => props.size || '1em')
const iconStrokeWidth = computed(() => props.strokeWidth || 2)

const clipboardRectPerimeter = 21.65685272216797
const clipboardPathLength = 56.56814193725586
const checkmarkPathLength = 22.627416610717773
</script>

<template>
  <div class="relative icon-container" :style="{ width: iconSize, height: iconSize }">
    <!-- Lucide Clipboard -->
    <svg
      :class="{ 'animate-out': props.copied }"
      class="icon clipboard-icon"
      xmlns="http://www.w3.org/2000/svg"
      :width="iconSize"
      :height="iconSize"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      :stroke-width="iconStrokeWidth"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <rect class="clipboard-rect" width="8" height="4" x="8" y="2" rx="1" ry="1" :style="{ strokeDasharray: clipboardRectPerimeter, strokeDashoffset: props.copied ? -clipboardRectPerimeter : 0 }" />
      <path class="clipboard-path" d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" :style="{ strokeDasharray: clipboardPathLength, strokeDashoffset: props.copied ? -clipboardPathLength : 0 }" />
    </svg>

    <!-- Lucide Check -->
    <svg
      :class="{ 'animate-in': props.copied }"
      class="icon checkmark-icon"
      xmlns="http://www.w3.org/2000/svg"
      :width="iconSize"
      :height="iconSize"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      :stroke-width="iconStrokeWidth"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <polyline class="checkmark-path" points="20 6 9 17 4 12" :style="{ strokeDasharray: checkmarkPathLength, strokeDashoffset: props.copied ? 0 : checkmarkPathLength }" />
    </svg>
  </div>
</template>

<style scoped>
.icon-container {
  display: inline-block;
  position: relative;
}

.icon {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  /* Base opacity for non-copied state */
  opacity: 1;
  transition: opacity 0.3s ease-in-out;
}

.clipboard-icon.animate-out {
  opacity: 0; /* Clipboard fades out */
  transition-delay: 0s; /* Start fading immediately */
}
.clipboard-icon .clipboard-rect,
.clipboard-icon .clipboard-path {
  transition: stroke-dashoffset 0.3s ease-in-out;
}

.checkmark-icon {
  opacity: 0; /* Checkmark starts transparent */
}
.checkmark-icon.animate-in {
  opacity: 1; /* Checkmark fades in */
  transition-delay: 0.1s; /* Checkmark fade-in starts slightly after clipboard fade-out begins */
}
.checkmark-icon .checkmark-path {
  transition: stroke-dashoffset 0.3s cubic-bezier(0.65, 0, 0.35, 1);
  /* Delay the path drawing to sync with opacity */
  transition-delay: 0.1s;
}
</style>
