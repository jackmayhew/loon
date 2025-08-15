<script setup lang="ts">
import { ChevronDown } from 'lucide-vue-next'

const props = defineProps<{
  text: string
  alternativesOpen: boolean
  showText: string
  hideText: string
}>()
</script>

<template>
  <BaseButton
    :aria-label="props.text"
    class="group relative inline-flex py-2 px-3 items-center justify-center overflow-hidden rounded border-zinc-500
    border-1.5 font-medium text-primary bg-white hover:bg-neutral-100 duration-300"
  >
    <!--
    This grid layout is a CSS trick to prevent the button from changing size
    when the text content changes.

    - The `visible-area` is what the user actually sees.
    - The two hidden `sizer` spans contain the longest possible button texts
      (`showText` and `hideText`).
    - The grid automatically expands to fit the widest `sizer`, ensuring the
      button's width remains constant and doesn't "jump" on text change.
  -->
    <div class="button-content-grid">
      <span class="visible-area w-full relative">
        <span class="text-xs w-full text-align-center">
          {{ props.text }}
        </span>
        <BaseIcon
          :icon="ChevronDown"
          :aria-label="props.text"
          class="w-4 h-4 ml-0.5 transition-transform duration-300 ease-in-out"
          :class="{ 'rotate-180': props.alternativesOpen }"
        />
      </span>

      <span class="sizer" aria-hidden="true">
        <span class="text-xs">{{ props.showText }}</span>
        <BaseIcon
          :icon="ChevronDown"
          class="w-4 h-4 ml-0.5"
        />
      </span>

      <span class="sizer" aria-hidden="true">
        <span class="text-xs">{{ props.hideText }}</span>
        <BaseIcon
          :icon="ChevronDown"
          class="w-4 h-4 ml-0.5"
        />
      </span>
    </div>
  </BaseButton>
</template>

<style scoped>
.button-content-grid {
  display: grid;
  align-items: center;
  justify-items: center;
}

.button-content-grid > * {
  grid-area: 1 / 1;
}

.visible-area {
  display: inline-flex;
  align-items: center;
  z-index: 1;
}

.sizer {
  visibility: hidden;
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
}
</style>
