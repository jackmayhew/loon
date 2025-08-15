<script setup lang="ts">
import { onClickOutside } from '@vueuse/core'
import { Store } from 'lucide-vue-next'
import ListingsPopover from '~/popup/components/product-cards/parts/ListingsPopover.vue'
import type { RetailerListings } from '~/types/products/alternative/additional-listings.types'
import type { usePopoverManager } from '~/composables/popup/ui/use-popover-manager'

const props = defineProps<{
  otherListings: RetailerListings
  manufacturerName: string
  clickOrigin: string
}>()

const POPOVER_ID = 'card-listings'
const manager = inject<ReturnType<typeof usePopoverManager>>('popoverManager')

const popoverRef = ref<HTMLElement | null>(null)
const buttonRef = ref<HTMLElement | null>(null)

const hasOtherListings = computed(() => {
  return props.otherListings && props.otherListings.length > 0
})

const isPopoverOpen = computed(() => manager?.activePopoverId.value === POPOVER_ID)

onClickOutside(
  popoverRef,
  () => {
    if (isPopoverOpen.value && manager)
      manager.close()
  },
  { ignore: [buttonRef] },
)
</script>

<template>
  <div class="relative inline-flex items-center">
    <template v-if="hasOtherListings">
      <!-- Show Tooltip ONLY when popover is closed -->
      <Tooltip
        :disabled="isPopoverOpen || manager?.activePopoverId.value !== null"
        :text="$t('productCard.tooltips.viewRetailers')"
        position="top"
        offset="1.5"
      >
        <BaseButton
          ref="buttonRef"
          :aria-label="$t('productCard.tooltips.viewRetailers')"
          @click="manager?.toggle(POPOVER_ID)"
        >
          <BaseIcon :icon="Store" class="w-4 h-4 text-tertiary" />
        </BaseButton>
      </Tooltip>
      <span
        class="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full border border-white"
        aria-hidden="true"
      />
      <Transition name="popover-animation">
        <ListingsPopover
          v-if="isPopoverOpen"
          ref="popoverRef"
          :listings="props.otherListings"
          :manufacturer-name="manufacturerName"
          :click-origin="clickOrigin"
          class="z-20"
          @close="manager?.close()"
        />
      </Transition>
    </template>
    <!-- Fallback static icon if no listings -->
    <BaseIcon
      v-else
      :icon="Store"
      :aria-label="$t('productCard.tooltips.retailer')"
      class="w-4 h-4 text-tertiary"
    />
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
