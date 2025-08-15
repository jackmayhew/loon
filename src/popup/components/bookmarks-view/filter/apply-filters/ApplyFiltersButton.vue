<script setup lang="ts">
import { ListCheck } from 'lucide-vue-next'

const emit = defineEmits(['apply'])

function handleClick() {
  emit('apply')
}
</script>

<template>
  <BaseButton
    :aria-label="$t('buttons.applySearchFilters')"
    class="flex w-full gap-2 rounded items-center py-2 px-1.5 hover:bg-neutral-100 duration-300"
    @click="handleClick"
  >
    <BaseIcon :icon="ListCheck" class="w-4 h-4" />
    {{ $t('buttons.applySearchFilters') }}
  </BaseButton>
</template>
