<script setup lang="ts">
import { RotateCw } from 'lucide-vue-next'

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
    <div class="ml-1.5 transition duration-600 group-hover:rotate-[360deg]">
      <BaseIcon
        :icon="RotateCw"
        class="w-4 h-4"
      />
    </div>
  </BaseButton>
</template>
