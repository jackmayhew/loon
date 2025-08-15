<script setup lang="ts">
import type { ScrapedProduct } from '~/types/products/scraped/scraped-product.types'

const props = defineProps<{
  product?: ScrapedProduct
}>()

const imageError = ref(false)
</script>

<template>
  <div v-if="props.product" class="flex flex-col">
    <div class="card_base">
      <div class="card_sm_img flex-shrink-0">
        <img
          v-if="props.product.image && !imageError"
          :src="props.product.image"
          :alt="props.product.name"
          class="w-full h-full object-cover rounded-md"
          @error="imageError = true"
        >
        <div v-else class="w-full h-full bg-gray-100 rounded-md flex items-center justify-center text-gray-500">
          {{ $t('errorMessages.noImage') }}
        </div>
      </div>
      <div class="flex-1 overflow-hidden">
        <div class="text-base font-medium text-primary w-full line-clamp-2 mb-2">
          {{ props.product.locale_name || props.product.name || $t('errorMessages.missingTitle') }}
        </div>
        <!-- Future features to implement:
        <div class="text-sm text-gray-600">
          // TODO: Use SKU/UPC/product data to determine country of origin
          // Some retailers like Walmart show 'Made in Canada' badges we could scrape
          <span>Canadian Product? {{ product.madeInCanada === true ? 'Yes' : 'Unknown' }}</span>
          {{ product.origin_country }}
        </div> -->

        <!-- TODO: Product origin badges (maybe)
        <span class="flex items-center gap-1 truncate text-xs">
          <div class="rounded-full"><Tag class="w-4 h-4" /></div>
          // Made in Canada badge
          // Product of Canada badge
          // Province/city origin
          // Match confidence score
        </span> -->
      </div>
    </div>
  </div>
</template>
