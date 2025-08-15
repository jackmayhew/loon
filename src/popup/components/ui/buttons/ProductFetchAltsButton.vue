<script setup lang="ts">
// NOTE: Consider creating base-button as wrapper for
// this component and CartFetchAltsButton
import { ArrowRight } from 'lucide-vue-next'

const props = defineProps<{
  text: string
}>()
</script>

<template>
  <BaseButton
    :aria-label="props.text"
    class="button_primary group relative inline-flex w-full py-3 px-5 items-center justify-center"
    wrapper-class="inline-block"
  >
    <div class="relative inline-flex -translate-x-0 items-center transition group-hover:translate-x-[21px]">
      <div class="absolute -translate-x-4 opacity-0 transition group-hover:-translate-x-6 group-hover:opacity-100">
        <BaseIcon
          :icon="ArrowRight"
          class="w-4 h-4"
        />
      </div>
      <span class="pr-5 text-sm">{{ props.text }}</span>
      <div class="absolute -right-0.5 translate-x-0 opacity-100 transition group-hover:translate-x-4 group-hover:opacity-0">
        <BaseIcon
          :icon="ArrowRight"
          class="w-4 h-4"
        />
      </div>
    </div>
  </BaseButton>
</template>
