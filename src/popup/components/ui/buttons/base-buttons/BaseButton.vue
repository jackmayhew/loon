<script setup lang="ts">
interface Props {
  ariaLabel?: string
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
  wrapperClass?: string
  role?: 'button' | 'switch'
}

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(defineProps<Props>(), {
  type: 'button',
  disabled: false,
  wrapperClass: 'flex',
  role: 'button',
})
</script>

<template>
  <div
    :class="[
      props.wrapperClass,
      { 'cursor-not-allowed': props.disabled },
    ]"
  >
    <button
      v-bind="$attrs"
      :disabled="props.disabled"
      :type="props.type"
      :aria-label="props.ariaLabel"
      :aria-disabled="props.disabled ? 'true' : undefined"
      :role="props.role"
      :class="{ 'opacity-50 pointer-events-none': props.disabled }"
    >
      <slot />
    </button>
  </div>
</template>
