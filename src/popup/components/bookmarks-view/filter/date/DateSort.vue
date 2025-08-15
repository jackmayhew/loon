<script setup lang="ts">
import { CalendarArrowDown, CalendarArrowUp } from 'lucide-vue-next'

const props = defineProps<{
  modelValue: 'asc' | 'desc'
}>()

const emit = defineEmits(['update:modelValue'])

function handleDateToggle() {
  const newOrder = props.modelValue === 'asc' ? 'desc' : 'asc'
  emit('update:modelValue', newOrder)
}
</script>

<template>
  <BaseButton
    class="flex w-full rounded items-center py-2 px-1.5 hover:bg-neutral-100 duration-300"
    :aria-label="modelValue === 'desc' ? 'Sort by Oldest First' : 'Sort by Newest First'"
    @click="handleDateToggle"
  >
    <span v-if="modelValue === 'asc'" class="flex gap-2 items-center">
      <BaseIcon :icon="CalendarArrowDown" class="w-4 h-4" />
      {{ $t('buttons.newestFirst') }}
    </span>
    <span v-else class="flex gap-2 items-center">
      <BaseIcon :icon="CalendarArrowUp" class="w-4 h-4" />
      {{ $t('buttons.oldestFirst') }}
    </span>
  </BaseButton>
</template>
