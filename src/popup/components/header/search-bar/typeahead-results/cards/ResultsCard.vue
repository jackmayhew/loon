<script setup lang="ts">
import { inject } from 'vue'
import { useI18n } from 'vue-i18n'
import { ArrowUpRight } from 'lucide-vue-next'
import { usePopoverManager } from '~/composables/popup/ui/use-popover-manager'
import { getFlagEmoji } from '~/utils/formatters/get-flag-emoji'
import { formatPriceNumber } from '~/utils/formatters/price-formatter'
import { trackProductClick } from '~/utils/analytics/track-product-click'
import Listings from '~/popup/components/header/search-bar/typeahead-results/cards/parts/Listings.vue'
import ActivePromo from '~/popup/components/header/search-bar/typeahead-results/cards/parts/ActivePromo.vue'
import type { TypeaheadProduct } from '~/types/search/typeahead-product.types'

defineProps<{
  result: TypeaheadProduct
}>()

const emit = defineEmits(['selectResult'])

const activeTabId = inject('activeTabId') as Ref<number>
const { locale } = useI18n()

const popoverManager = usePopoverManager()
provide('popoverManager', popoverManager)

function handleClick(item: TypeaheadProduct) {
  // Track click
  trackProductClick({
    manufacturerName: item.manufacturer_name,
    retailerName: item.retailer_name,
    productUrl: item.active_promo?.url || item.affiliate_url || item.purchase_url,
    clickOrigin: 'typeahead',
  }, activeTabId.value)
}
</script>

<template>
  <li
    class="p-2 cursor-pointer border-b last:border-none hover:bg-gray-100 transition-colors duration-150"
    @click="emit('selectResult', result)"
  >
    <div class="flex gap-2 relative">
      <div class="w-12 h-12 flex-shrink-0 rounded overflow-hidden aspect-ratio-1/1">
        <img :src="result.image_url" class="h-full w-full object-cover rounded">
      </div>
      <div class="flex flex-col justify-evenly w-full relative min-w-0">
        <HighlightedText
          :text="result.product_name_highlighted"
          class="text-sm w-full truncate"
        />
        <div class="flex gap-1.5 items-center">
          <div class="relative w-fit flex">
            <Listings
              :other-listings="result.other_listings"
              :manufacturer="result.manufacturer_name"
            />
          </div>
          <div v-if="result.active_promo" class="relative w-fit flex ml-0.5">
            <ActivePromo
              :active-promo="result.active_promo"
            />
          </div>
          <span class="text-tertiary text-xs flex font-medium w-fit h-fit">
            {{ $t('productCard.priceFormat', { value: formatPriceNumber(result.current_price, locale) }) }}
          </span>
          <div class="flex">
            <span
              v-if="getFlagEmoji(result.retailer_country)"
              :title="$t('accessibility.countryCode', { value: result.retailer_country })"
              :aria-label="$t('accessibility.countryCode', { value: result.retailer_country })"
              class="flex-shrink-0"
            >
              {{ getFlagEmoji(result.retailer_country) }}
            </span>
          </div>
          <div class="text-tertiary text-xs font-medium truncate pr-2 -ml-1 mr-auto">
            {{ result.retailer_name }}
          </div>

          <BaseLinkButton
            :href="result.active_promo?.url || result.affiliate_url || result.purchase_url"
            target="_blank"
            promo
            :aria-label="$t('buttons.shop')"
            class="group flex items-center text-xs font-medium ml-auto"
            @click.stop="handleClick(result)"
          >
            {{ $t('buttons.shop') }}
            <BaseIcon
              :icon="ArrowUpRight"
              :aria-label="$t('productCard.tooltips.viewRetailers')"
              class="w-4 h-4 ml-1 text-primary transition-transform duration-150 ease-in-out group-hover:rotate-45"
            />
          </BaseLinkButton>
        </div>
      </div>
    </div>
  </li>
</template>
