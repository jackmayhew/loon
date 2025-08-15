<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { getFlagEmoji } from '~/utils/formatters/get-flag-emoji'
import { formatPriceNumber } from '~/utils/formatters/price-formatter'
import ActivePromo from '~/popup/components/product-cards/parts/ActivePromo.vue'
import Listings from '~/popup/components/product-cards/parts/Listings.vue'
import BookmarkProduct from '~/popup/components/product-cards/parts/BookmarkProduct.vue'
import { usePopoverManager } from '~/composables/popup/ui/use-popover-manager'
import type { AlternativeProduct } from '~/types/products/alternative/alternative-product.types'

const props = defineProps<{
  product?: AlternativeProduct
}>()

const { locale } = useI18n()

const product = computed(() => props.product)
const otherListingsData = computed(() => product.value?.other_listings)
const activePromo = computed(() => product.value?.activePromo)

const popoverManager = usePopoverManager()
provide('popoverManager', popoverManager)
</script>

<template>
  <div v-if="product" class="card_base relative group/card">
    <div class="w-1/3 h-42 flex-shrink-0">
      <img
        :src="product.image_url"
        :alt="product.name"
        class="w-full h-full object-cover rounded-md"
      >
    </div>
    <div class="flex flex-col gap-2 w-2/3 pr-4">
      <div class="flex flex-col">
        <h2 class="card_heading text-sm">
          {{ product.product_name }}
        </h2>
        <div class="flex items-center gap-2">
          <div class="text-secondary truncate min-w-0 text-xs">
            {{ product.manufacturer_name }}
          </div>
          <span class="flex-shrink-0 flex items-center gap-1 pr-10.5">
            <!--
             NOTE: Future implementation will include specific Canadian origin tags
             once this data is available
             -->
            <!-- <Tag class="w-4 h-4 border rounded-full" /> Made in canada -->
            <!-- <Tag class="w-4 h-4 border rounded-full" /> Canadian owned? -->
            <!-- <Tag class="w-4 h-4 border rounded-full" /> Product of canada -->
            <!-- <Tag class="w-4 h-4 border rounded-full" /> Province/city origin? -->
          </span>
        </div>
      </div>
      <div class="border-b border-gray-200 w-full" />
      <div class="flex flex-col gap-1.5">
        <p class="text-secondary w-full truncate text-xs">
          {{ product.product_description }}
        </p>
        <div class="flex gap-1.5 items-center">
          <Listings
            :other-listings="otherListingsData"
            :manufacturer-name="product.manufacturer_name"
            click-origin="bookmarks"
          />
          <span class="text-tertiary flex font-medium text-xs">
            {{ $t('productCard.priceFormat', { value: formatPriceNumber(product.current_price, locale) }) }}
          </span>
          <div class="flex items-center overflow-hidden">
            <span
              v-if="getFlagEmoji(product.retailer_country)"
              :title="$t('accessibility.countryCode', { value: product.retailer_country })"
              :aria-label="$t('accessibility.countryCode', { value: product.retailer_country })"
              class="flex-shrink-0 mr-0.5"
            >
              {{ getFlagEmoji(product.retailer_country) }}
            </span>
            <div class="text-tertiary truncate text-xs font-medium">
              {{ product.retailer_name }}
            </div>
          </div>
        </div>
        <div v-if="activePromo" class="flex gap-1.5">
          <ActivePromo
            :active-promo="activePromo"
          />
        </div>
      </div>
      <div class="border-b border-gray-200 w-full" />
      <div class="flex gap-2">
        <BookmarkProduct :product="product" />
        <ViewProductButton
          :href="product.activePromo?.url || product.affiliate_url || product.purchase_url"
          :text="$t('buttons.viewProduct')"
          :manufacturer-name="product.manufacturer_name"
          :retailer-name="product.retailer_name"
          click-origin="bookmarks"
        />
      </div>
    </div>
  </div>
</template>
