<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  text: string
  position?: 'top' | 'right' | 'bottom' | 'left'
  offset: '0' | '0.5' | '1' | '1.5' | '2'
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  position: 'top',
  offset: '2',
  disabled: false,
})

const positionClasses = computed(() => {
  const offsetVal = props.offset
  switch (props.position) {
    case 'top':
      return `bottom-full left-1/2 -translate-x-1/2 mb-${offsetVal}`
    case 'right':
      return `left-full top-1/2 -translate-y-1/2 ml-${offsetVal}`
    case 'bottom':
      return `top-full left-1/2 -translate-x-1/2 mt-${offsetVal}`
    case 'left':
      return `right-full top-1/2 -translate-y-1/2 mr-${offsetVal}`
    default:
      return `bottom-full left-1/2 -translate-x-1/2 mb-${offsetVal}`
  }
})

const animationEntryClasses = computed(() => {
  switch (props.position) {
    case 'top':
      return 'translate-y-1'
    case 'right':
      return '-translate-x-1'
    case 'bottom':
      return '-translate-y-1'
    case 'left':
      return 'translate-x-1'
    default:
      return 'translate-y-1'
  }
})

const animationHoverClasses = computed(() => {
  switch (props.position) {
    case 'right':
    case 'left':
      return 'group-hover:translate-x-0 group-focus-within:translate-x-0'
    case 'top':
    case 'bottom':
    default:
      return 'group-hover:translate-y-0 group-focus-within:translate-y-0'
  }
})
</script>

<template>
  <div class="relative group flex">
    <slot />
    <span
      v-if="!props.disabled"
      class="z-50 absolute p-2 text-xs tooltip_bg tooltip_text rounded-md whitespace-nowrap
      opacity-0 scale-95 pointer-events-none transition-all duration-150 ease-out
      group-hover:opacity-100 group-hover:scale-100 group-hover:pointer-events-auto
      group-focus-within:opacity-100 group-focus-within:scale-100 group-focus-within:pointer-events-auto select-none"
      :class="[
        positionClasses,
        animationEntryClasses,
        animationHoverClasses,
      ]"
    >
      {{ text }}
    </span>
  </div>
</template>
