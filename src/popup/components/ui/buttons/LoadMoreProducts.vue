<script setup lang="ts">
const props = defineProps<{
  text: string
}>()
</script>

<template>
  <BaseButton
    :aria-label="props.text"
    class="button_primary group relative inline-flex min-w-32 py-3 px-5 items-center justify-center"
  >
    <span class="text-sm">{{ props.text }}</span>
  </BaseButton>
</template>
