<script setup lang="ts">
import { openLinkAndClosePopup } from '~/utils/dom/link-handler'

interface Props {
  href: string
  ariaLabel?: string
  target?: '_self' | '_blank' | '_parent' | '_top'
  rel?: string
  disabled?: boolean
  wrapperClass?: string
}

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(defineProps<Props>(), {
  target: '_blank',
  disabled: false,
})

const emit = defineEmits(['click'])

const effectiveRel = computed(() => {
  if (props.target === '_blank') {
    return props.rel ? `${props.rel} noopener noreferrer` : 'noopener noreferrer'
  }
  return props.rel
})

const actualHref = computed(() => {
  return props.disabled ? undefined : props.href
})

async function handleClick(event: MouseEvent) {
  // 1. Prevent the <a> tag's default link-opening behavior
  event.preventDefault()

  // 2. Handle disabled state
  if (props.disabled) {
    event.stopPropagation()
    return
  }

  // 3. Emit parents event
  emit('click', event)

  // 4. Open the link using the dedicated extension utility
  openLinkAndClosePopup(props.href)
}
</script>

<template>
  <div
    class="base-link-button-wrapper"
    :class="[
      props.wrapperClass,
      { 'cursor-not-allowed': props.disabled },
    ]"
  >
    <a
      :href="actualHref"
      :target="props.target"
      :rel="effectiveRel"
      :aria-label="props.ariaLabel"
      :aria-disabled="props.disabled ? 'true' : undefined"
      :class="{ 'opacity-50 pointer-events-none': props.disabled }"
      v-bind="$attrs"
      role="button"
      @click="handleClick($event)"
    >
      <slot />
    </a>
  </div>
</template>

<style scoped>
.base-link-button-wrapper {
  display: inline-block;
}
</style>
