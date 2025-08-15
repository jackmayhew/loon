<script setup lang="ts">
import { ArrowRight } from 'lucide-vue-next'
import { trackProductClick } from '~/utils/analytics/track-product-click'

const props = defineProps<{
  href: string
  text: string
  manufacturerName: string
  retailerName: string
  clickOrigin: string
}>()

const activeTabId = inject('activeTabId') as Ref<number>

function handleProductClick() {
  trackProductClick({
    manufacturerName: props.manufacturerName,
    retailerName: props.retailerName,
    productUrl: props.href,
    clickOrigin: props.clickOrigin,
  }, activeTabId.value)
}
</script>

<template>
  <BaseLinkButton
    :href="props.href"
    target="_blank"
    :aria-label="props.text"
    wrapper-class="w-full"
    class="button_primary group relative inline-flex w-full py-2.5 px-5 items-center justify-center"
    @click="handleProductClick"
  >
    <div class="relative inline-flex -translate-x-0 items-center transition group-hover:translate-x-[21px]">
      <div class="absolute -translate-x-4 opacity-0 transition group-hover:-translate-x-6 group-hover:opacity-100 text-xs">
        <BaseIcon
          :icon="ArrowRight"
          class="w-4 h-4"
        />
      </div>
      <span class="pr-5 text-xs">{{ props.text }}</span>
      <div class="absolute -right-0.5 translate-x-0 opacity-100 transition group-hover:translate-x-4 group-hover:opacity-0">
        <BaseIcon
          :icon="ArrowRight"
          class="w-4 h-4"
        />
      </div>
    </div>
  </BaseLinkButton>
</template>
