<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { ArrowUpRight, X } from 'lucide-vue-next'
import { getFlagEmoji } from '~/utils/formatters/get-flag-emoji'
import { formatPriceNumber } from '~/utils/formatters/price-formatter'
import { trackProductClick } from '~/utils/analytics/track-product-click'
import { openLinkAndClosePopup } from '~/utils/dom/link-handler'
import type { RetailerListingItem, RetailerListings } from '~/types/products/alternative/additional-listings.types'

const props = defineProps<{
  listings: RetailerListings
  manufacturerName: string
  clickOrigin: string
}>()

const emit = defineEmits(['close'])

const activeTabId = inject('activeTabId') as Ref<number>

const { locale } = useI18n()

const MAX_LISTING_COUNT = 3 // Limited space in popover

function handleClick(item: RetailerListingItem) {
  trackProductClick({
    manufacturerName: props.manufacturerName,
    retailerName: item.retailer_name,
    productUrl: item.purchase_url,
    clickOrigin: `${props.clickOrigin}-more-listings`,
  }, activeTabId.value)

  openLinkAndClosePopup(item.purchase_url)
}
</script>

<template>
  <div
    class="absolute z-10 w-48 rounded-md button_primary_bg button_primary_text shadow-lg ring-1
  ring-black ring-opacity-5 focus:outline-none p-2 text-sm bottom-full left-1/2 -translate-x-1/2 mb-1.5"
    role="dialog"
    aria-modal="true"
    :aria-label="$t('productCard.listingsPopover.title')"
  >
    <div class="flex justify-between items-start mb-2">
      <h3 class="font-medium whitespace-nowrap pr-3">
        {{ $t('productCard.listingsPopover.title') }}
      </h3>
      <BaseButton
        :aria-label="$t('accessibility.closeButton')"
        class="p-0.5 rounded-full hover:bg-zinc-700"
        @click="emit('close')"
      >
        <BaseIcon
          :icon="X"
          class="w-4 h-4"
        />
      </BaseButton>
    </div>

    <ul v-if="props.listings && props.listings.length > 0" class="space-y-1.5">
      <!-- TODO: :key="listing_id" -->
      <li v-for="item in props.listings.slice(0, MAX_LISTING_COUNT)" :key="item.purchase_url">
        <a
          :href="item.purchase_url"
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-center justify-between p-1 -m-1 rounded group"
          @click.prevent="handleClick(item)"
        >
          <div class="flex items-center space-x-1.5 truncate">
            <span
              v-if="getFlagEmoji(item.retailer_country)"
              :title="$t('accessibility.countryCode', { value: item.retailer_country })"
              :aria-label="$t('accessibility.countryCode', { value: item.retailer_country })"
              class="flex-shrink-0 translate-z-0"
            >
              {{ getFlagEmoji(item.retailer_country) }}
            </span>
            <span class="truncate pr-1.5">
              {{ item.retailer_name }}
            </span>
          </div>
          <div class="flex items-center flex-shrink-0">
            <span class="text-neutral-300 text-xs">
              {{ $t('productCard.priceFormat', { value: formatPriceNumber(item.current_price, locale) }) }}
            </span>
            <BaseIcon
              :icon="ArrowUpRight"
              :aria-label="$t('productCard.tooltips.viewRetailers')"
              class="w-4 h-4 ml-1 text-neutral-300 group-hover:button_primary_text transition-transform
              delay-100 duration-150 ease-in-out group-hover:rotate-45"
            />
          </div>
        </a>
      </li>
    </ul>
    <p v-else class="text-zinc-400 text-xs">
      {{ $t('productCard.listingsPopover.noListings') }}
    </p>
  </div>
</template>
