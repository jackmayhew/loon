<script setup lang="ts">
import { computed } from 'vue'
import { Tag } from 'lucide-vue-next'

const props = defineProps<{
  promotion: boolean | null
}>()

const emit = defineEmits(['update:promotion'])

const promoActive = computed(() => props.promotion)

function handleToggleClick() {
  emit('update:promotion', !props.promotion)
}
</script>

<template>
  <div class="flex gap-2 w-full rounded items-center py-2 px-1.5 hover:bg-neutral-100 duration-300">
    <div class="flex">
      <BaseIcon :icon="Tag" class="w-4 h-4" />
    </div>
    <div class="flex justify-between w-full">
      {{ $t('accessibility.promotionsTitle') }}
      <BaseButton
        type="button"
        :aria-label="!promoActive ? $t('accessibility.enablePromotionSearchFilter') : $t('accessibility.disablePromotionSearchFilter')"
        class="relative inline-flex h-5 w-10 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out"
        :class="[
          promoActive ? 'bg-zinc-700' : 'bg-gray-300',
        ]"
        role="switch"
        :aria-checked="promoActive"
        @click="handleToggleClick"
      >
        <span
          aria-hidden="true"
          class="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
          :class="[
            promoActive ? 'translate-x-5' : 'translate-x-0',
          ]"
        />
      </BaseButton>
    </div>
  </div>
</template>
