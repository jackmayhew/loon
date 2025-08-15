<script setup lang="ts">
import { onClickOutside } from '@vueuse/core'
import { Tag } from 'lucide-vue-next'
import PromoPopover from '~/popup/components/header/search-bar/typeahead-results/cards/parts/PromoPopover.vue'
import type { PromoData } from '~/types/products/alternative/promo.types'
import type { usePopoverManager } from '~/composables/popup/ui/use-popover-manager'

const props = defineProps<{
  activePromo: PromoData
}>()

const POPOVER_ID = 'promos'
const manager = inject<ReturnType<typeof usePopoverManager>>('popoverManager')

const popoverRef = ref<HTMLElement | null>(null)
const buttonRef = ref<HTMLElement | null>(null)

const isPopoverOpen = computed(() => manager?.activePopoverId.value === POPOVER_ID)

onClickOutside(popoverRef, () => {
  if (isPopoverOpen.value && manager)
    manager.close()
}, { ignore: [buttonRef] })
</script>

<template>
  <div class="relative inline-flex items-center" @click.stop>
    <Tooltip
      :disabled="isPopoverOpen || manager?.activePopoverId.value !== null"
      :text="$t('accessibility.viewPromos')"
      position="top"
      offset="1.5"
    >
      <BaseButton
        ref="buttonRef"
        :aria-label="$t('accessibility.viewPromos')"
        @click="manager?.toggle(POPOVER_ID)"
      >
        <BaseIcon :icon="Tag" class="w-4 h-4 text-tertiary" />
      </BaseButton>
    </Tooltip>

    <span
      class="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full border border-white"
      aria-hidden="true"
    />
    <Transition name="popover-animation">
      <PromoPopover
        v-if="isPopoverOpen"
        ref="popoverRef"
        :active-promo="props.activePromo"
        @close="manager?.close()"
      />
    </Transition>
  </div>
</template>

<style scoped>
.popover-animation-enter-active,
.popover-animation-leave-active {
  transition: all 150ms ease-out;
}
.popover-animation-enter-from,
.popover-animation-leave-to {
  opacity: 0;
  transform: translateX(-50%) scale(0.95) translateY(4px);
}
.popover-animation-enter-to,
.popover-animation-leave-from {
  opacity: 1;
  transform: translateX(-50%) scale(1) translateY(0);
}
</style>
