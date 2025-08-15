<script setup lang="ts">
import { type FunctionalComponent, type SVGAttributes, computed } from 'vue'

// SVGAttributes allows passing SVG-specific attributes if needed, though $attrs handles most
type IconComponent = FunctionalComponent<SVGAttributes, Record<string, never>> | Record<string, any>

interface Props {
  icon: IconComponent
  ariaLabel?: string
  isFocusable?: boolean
  role?: string
  isInteractive?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isFocusable: false,
  isInteractive: false,
})

const effectiveRole = computed(() => {
  if (props.role) {
    return props.role
  }
  return props.isFocusable ? 'img' : undefined
})

const effectiveAriaHidden = computed(() => {
  return (props.isFocusable && props.ariaLabel) ? undefined : 'true'
})
</script>

<template>
  <component
    :is="props.icon"
    :class="{ 'pointer-events-none': !props.isInteractive }"
    :aria-label="props.ariaLabel"
    :tabindex="props.isFocusable ? 0 : undefined"
    :role="effectiveRole"
    :aria-hidden="effectiveAriaHidden"
    v-bind="$attrs"
  />
</template>
