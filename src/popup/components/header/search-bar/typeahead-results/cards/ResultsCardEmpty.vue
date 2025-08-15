<script setup lang="ts">
import { Image } from 'lucide-vue-next'

defineProps<{
  message: string
  isError?: boolean
}>()
</script>

<template>
  <li class="py-2 px-2 hover:bg-gray-100 border-b last:border-none transition-colors duration-150">
    <div class="flex gap-2 relative">
      <div class="w-12 h-12 flex-shrink-0 rounded overflow-hidden aspect-ratio-1/1 flex items-center justify-center">
        <BaseIcon
          :icon="Image"
          :aria-label="$t('accessibility.imagePlaceholder')"
          class="w-10 h-10 text-zinc-500"
        />
      </div>
      <div class="flex items-center w-full relative min-w-0">
        <span
          class="text-xs w-full"
          :class="{ error_text: isError }"
        >
          {{ message }}
        </span>
      </div>
    </div>
  </li>
</template>
